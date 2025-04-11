import {
  UIMessage,
  appendResponseMessages,
  createDataStreamResponse,
  smoothStream,
  streamText,
} from 'ai';
import { auth } from '@/app/(auth)/auth';
import { systemPrompt } from '@/lib/ai/prompts';
import {
  deleteChatById,
  getChatById,
  saveChat,
  saveMessages,
} from '@/lib/db/queries';
import {
  generateUUID,
  getMostRecentUserMessage,
  getTrailingMessageId,
} from '@/lib/utils';
import { generateTitleFromUserMessage } from '../../actions';
import { createDocument } from '@/lib/ai/tools/create-document';
import { updateDocument } from '@/lib/ai/tools/update-document';
import { requestSuggestions } from '@/lib/ai/tools/request-suggestions';
import { getWeather } from '@/lib/ai/tools/get-weather';
import { isProductionEnvironment } from '@/lib/constants';
import { myProvider } from '@/lib/ai/providers';

export const maxDuration = 60;

export async function POST(request: Request) {
  console.log('🔵 [Chat API] POST request received');
  try {
    const {
      id,
      messages,
      selectedChatModel,
    }: {
      id: string;
      messages: Array<UIMessage>;
      selectedChatModel: string;
    } = await request.json();

    console.log(`🔵 [Chat API] Processing chat with ID: ${id}, model: ${myProvider.languageModel(selectedChatModel).modelId}`);

    const session = await auth();

    if (!session || !session.user || !session.user.id) {
      console.error('🔵 [Chat API] Unauthorized: No valid session found');
      return new Response('Unauthorized', { status: 401 });
    }

    const userMessage = getMostRecentUserMessage(messages);

    if (!userMessage) {
      console.error('🔵 [Chat API] No user message found in request');
      return new Response('No user message found', { status: 400 });
    }

    // Perform vector search for RAG
    let context = '';
    try {
      const userMessageText = userMessage.parts
        .filter((part): part is { type: 'text'; text: string } => part.type === 'text')
        .map(part => part.text)
        .join(' ');

      const searchResponse = await fetch(`/api/rag/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: userMessageText,
        }),
      });

      if (searchResponse.ok) {
        const { context: searchContext } = await searchResponse.json();
        context = searchContext;
      }
    } catch (error) {
      console.error('🔵 [Chat API] Error performing vector search:', error);
      // Continue without context if search fails
    }

    const chat = await getChatById({ id });

    if (!chat) {
      console.log(`🔵 [Chat API] Creating new chat with ID: ${id}`);
      const title = await generateTitleFromUserMessage({
        message: userMessage,
      });

      await saveChat({ id, userId: session.user.id, title });
      console.log(`🔵 [Chat API] New chat created with title: ${title}`);
    } else {
      if (chat.userId !== session.user.id) {
        console.error(`🔵 [Chat API] Unauthorized: User ${session.user.id} does not own chat ${id}`);
        return new Response('Unauthorized', { status: 401 });
      }
    }

    console.log(`🔵 [Chat API] Saving user message for chat ${id}`);
    await saveMessages({
      messages: [
        {
          chatId: id,
          id: userMessage.id,
          role: 'user',
          parts: userMessage.parts,
          attachments: userMessage.experimental_attachments ?? [],
          createdAt: new Date(),
        },
      ],
    });

    // log the context
    console.log('🔵 [Chat API] Context:', context);

    context = 'This is a test context';

    // log the selectedChatModel
    console.log('🔵 [Chat API] Selected chat model:', selectedChatModel);

    // log the system prompt
    console.log('🔵 [Chat API] System prompt:', systemPrompt({ selectedChatModel, context }));

    return createDataStreamResponse({
      execute: (dataStream) => {
        console.log(`🔵 [Chat API] Starting stream for chat ${id} with model: ${myProvider.languageModel(selectedChatModel).modelId}`);
        const result = streamText({
          model: myProvider.languageModel(selectedChatModel),
          system: systemPrompt({ selectedChatModel, context }),
          messages,
          maxSteps: 5,
          experimental_activeTools:
            selectedChatModel === 'chat-model-reasoning'
              ? []
              : [
                  'getWeather',
                  'createDocument',
                  'updateDocument',
                  'requestSuggestions',
                ],
          experimental_transform: smoothStream({ chunking: 'word' }),
          experimental_generateMessageId: generateUUID,
          tools: {
            getWeather,
            createDocument: createDocument({ session, dataStream }),
            updateDocument: updateDocument({ session, dataStream }),
            requestSuggestions: requestSuggestions({
              session,
              dataStream,
            }),
          },
          onFinish: async ({ response }) => {
            if (session.user?.id) {
              try {
                const assistantId = getTrailingMessageId({
                  messages: response.messages.filter(
                    (message) => message.role === 'assistant',
                  ),
                });

                if (!assistantId) {
                  console.error('🔵 [Chat API] No assistant message found in response');
                  throw new Error('No assistant message found!');
                }

                const [, assistantMessage] = appendResponseMessages({
                  messages: [userMessage],
                  responseMessages: response.messages,
                });

                console.log(`🔵 [Chat API] Saving assistant message for chat ${id}`);
                await saveMessages({
                  messages: [
                    {
                      id: assistantId,
                      chatId: id,
                      role: assistantMessage.role,
                      parts: assistantMessage.parts,
                      attachments:
                        assistantMessage.experimental_attachments ?? [],
                      createdAt: new Date(),
                    },
                  ],
                });
                console.log(`🔵 [Chat API] Successfully saved assistant message for chat ${id}`);
              } catch (error) {
                console.error('🔵 [Chat API] Failed to save chat:', error);
              }
            }
          },
          experimental_telemetry: {
            isEnabled: isProductionEnvironment,
            functionId: 'stream-text',
          },
        });

        result.consumeStream();

        result.mergeIntoDataStream(dataStream, {
          sendReasoning: true,
        });
      },
      onError: (error) => {
        console.error('🔵 [Chat API] Stream error:', error);
        return 'Oops, an error occurred!';
      },
    });
  } catch (error) {
    console.error('🔵 [Chat API] POST request error:', error);
    return new Response('An error occurred while processing your request!', {
      status: 404,
    });
  }
}

export async function DELETE(request: Request) {
  console.log('🔵 [Chat API] DELETE request received');
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    console.error('🔵 [Chat API] DELETE request missing chat ID');
    return new Response('Not Found', { status: 404 });
  }

  console.log(`🔵 [Chat API] Processing delete request for chat ${id}`);
  const session = await auth();

  if (!session || !session.user) {
    console.error('🔵 [Chat API] Unauthorized: No valid session found for delete request');
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const chat = await getChatById({ id });

    if (chat.userId !== session.user.id) {
      console.error(`🔵 [Chat API] Unauthorized: User ${session.user.id} does not own chat ${id}`);
      return new Response('Unauthorized', { status: 401 });
    }

    console.log(`🔵 [Chat API] Deleting chat ${id}`);
    await deleteChatById({ id });
    console.log(`🔵 [Chat API] Successfully deleted chat ${id}`);

    return new Response('Chat deleted', { status: 200 });
  } catch (error) {
    console.error(`🔵 [Chat API] Error deleting chat ${id}:`, error);
    return new Response('An error occurred while processing your request!', {
      status: 500,
    });
  }
}
