import { Composition, Folder } from "remotion";
import { HelloWorld, myCompSchema } from "../HelloWorld";

export const FallbackCompositions: React.FC = () => {
  return (
    <Folder name="Reelright">
      <Composition
        id="HelloWorld"
        component={HelloWorld}
        durationInFrames={150}
        fps={30}
        width={1920}
        height={1080}
        schema={myCompSchema}
        defaultProps={{
          titleText: "Reelright",
          titleColor: "#111827",
          logoColor1: "#8b5cf6",
          logoColor2: "#ec4899",
        }}
      />
    </Folder>
  );
};
