import Mobile from "./Mobile";
import Laptop from "./Laptop";
import Tablet from "./Tablet";
import { motion } from "motion/react";

const Mockups = () => {
  return (
    <motion.div className="pb-20">
      <div className="relative">
        <motion.div
          className="absolute z-10 bottom-0 left-0"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <Tablet />
        </motion.div>
        <motion.div
          className="mb-10"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Laptop />
        </motion.div>
        <motion.div
          className="absolute z-10 bottom-0 right-0"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          <Mobile />
        </motion.div>
      </div>
    </motion.div>
  );
};

export default Mockups;
