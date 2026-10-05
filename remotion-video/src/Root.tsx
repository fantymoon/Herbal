import "./index.css";
import { HerbalCompositions } from "./Composition";
import { TopicCompositions } from "./topics/Compositions";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <HerbalCompositions />
      <TopicCompositions />
    </>
  );
};
