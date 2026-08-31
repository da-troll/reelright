import { Composition, Folder, Still } from "remotion";
import type { AdapterCatalog } from "./catalog";

export const AdapterRoot: React.FC<{ catalog: AdapterCatalog }> = ({
  catalog,
}) => {
  return (
    <Folder name={catalog.folderName}>
      {catalog.stills.map((entry) => (
        <Still
          key={entry.id}
          id={entry.id}
          component={entry.component}
          width={entry.width}
          height={entry.height}
        />
      ))}
      {catalog.compositions?.map((entry) => (
        <Composition
          key={entry.id}
          id={entry.id}
          component={entry.component}
          calculateMetadata={entry.calculateMetadata}
          durationInFrames={entry.durationInFrames}
          fps={entry.fps}
          width={entry.width}
          height={entry.height}
        />
      ))}
    </Folder>
  );
};
