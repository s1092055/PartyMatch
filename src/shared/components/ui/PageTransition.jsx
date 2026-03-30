import { motion } from "framer-motion";

const MotionDiv = motion.div;

export function PageTransition({ children }) {
  return (
    <MotionDiv
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className="w-full"
    >
      {children}
    </MotionDiv>
  );
}
