import { motion } from "framer-motion";
import { useUserOrg } from "@/app/hooks/useAuth";
import { useOrganizationPreferences } from "@/app/hooks/useOrganizationPreferences";

export const Greeting = () => {
  const orgIds = useUserOrg();
  const { preferences, isLoading } = useOrganizationPreferences(
    orgIds[0] || null
  );

  return (
    <div
      key="overview"
      className="max-w-3xl mx-auto md:mt-20 px-8 size-full flex flex-col justify-center"
    >
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 10 }}
        transition={{ delay: 0.5 }}
        className="text-2xl font-semibold"
      >
        {isLoading
          ? "Loading..."
          : preferences?.greetingTitle || "Hello there!"}
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 10 }}
        transition={{ delay: 0.6 }}
        className="text-2xl text-zinc-500"
      >
        {isLoading
          ? "Loading..."
          : preferences?.greetingSubtitle || "How can I help you today?"}
      </motion.div>
    </div>
  );
};
