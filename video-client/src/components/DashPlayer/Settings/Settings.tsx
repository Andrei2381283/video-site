import { ReactComponent as SettingsIcon } from "../../../assets/settings.svg";
import {
  Dispatch,
  FC,
  RefObject,
  SetStateAction,
  useEffect,
  useRef,
  useState,
} from "react";
import dashStyles from "../DashPlayer.module.css";
import styles from "./Settings.module.css";
import {
  DashRepresentation,
  getVideoQualityKey,
  getVideoQualityLabel,
  useVideoQualitiesControl,
} from "../helpers";
import { MediaPlayerClass } from "dashjs";
import Hls from "hls.js";
import { EpisodeSection } from "types/player";

const sectionNames: Record<string, string> = {
  screen: "Интро",
  titer: "Титры",
};

type ListItem = {
  title: string;
  active?: boolean;
  hidden?: boolean;
  onClick?: () => void;
};

type SettingsProps = {
  videoQualities: DashRepresentation[];
  playerRef: RefObject<MediaPlayerClass | null>;
  hlsRef: RefObject<Hls | null>;
  isHlsActive: boolean;
  sections: EpisodeSection[];
  disabledSections: string[];
  setDisabledSections: Dispatch<SetStateAction<string[]>>;
};

export const Settings: FC<SettingsProps> = ({
  videoQualities,
  playerRef,
  hlsRef,
  isHlsActive,
  sections,
  disabledSections,
  setDisabledSections,
}) => {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const [currentList, setCurrentList] = useState<keyof typeof lists | null>(
    null,
  );
  const [currentQuality, setCurrentQuality] = useVideoQualitiesControl(
    videoQualities,
    playerRef,
    hlsRef,
    isHlsActive,
  );

  const toggleSection = (sectionType: string) => {
    if (disabledSections.includes(sectionType)) {
      setDisabledSections(
        disabledSections.filter((dSection) => dSection !== sectionType),
      );
    } else {
      setDisabledSections([...disabledSections, sectionType]);
    }
  };

  const videoQualitiesList: ListItem[] = [
    {
      title: "< Назад",
      onClick: () => setCurrentList("baseList"),
    },
    {
      title: "Авто",
      active: currentQuality === "auto",
      onClick: () => setCurrentQuality("auto"),
    },
    ...videoQualities.map((quality) => ({
      title: getVideoQualityLabel(quality),
      active: currentQuality === getVideoQualityKey(quality),
      onClick: () => setCurrentQuality(getVideoQualityKey(quality)),
    })),
  ];

  const sectionsList: ListItem[] = [
    {
      title: "< Назад",
      onClick: () => setCurrentList("baseList"),
    },
    ...sections.map((section) => ({
      title: sectionNames[section.type] || section.title || section.type,
      active: disabledSections.includes(section.type),
      onClick: () => toggleSection(section.type),
    })),
  ];

  const baseList: ListItem[] = [
    {
      title:
        "Качество: " +
        (currentQuality === "auto"
          ? "Авто"
          : getVideoQualityLabel(currentQuality)),
      onClick: () => setCurrentList("videoQualitiesList"),
    },
    {
      title: "Сегменты: " + disabledSections.length,
      onClick: () => setCurrentList("sectionsList"),
    },
  ];

  const lists = {
    baseList,
    videoQualitiesList,
    sectionsList,
  };

  useEffect(() => {
    const listener = (event: MouseEvent) => {
      const path = event.composedPath();
      if (
        !listRef.current ||
        !buttonRef.current ||
        (!path.includes(listRef.current) && !path.includes(buttonRef.current))
      ) {
        setCurrentList((lastValue) => (lastValue ? null : lastValue));
      }
    };

    document.addEventListener("click", listener, true);

    return () => document.removeEventListener("click", listener);
  }, []);

  return (
    <div className={styles.container}>
      {!!currentList && (
        <div ref={listRef} className={styles.settingsList}>
          {lists[currentList].map((item, i) => (
            <div
              key={item.title + i}
              className={[
                styles.settingsListItem,
                item.active ? styles.active : null,
              ]
                .filter(Boolean)
                .join(" ")}
              onClick={item.onClick}
            >
              {item.title}
            </div>
          ))}
        </div>
      )}
      <button
        type="button"
        className={dashStyles.dashBottomItem}
        aria-label="Настройки"
        aria-haspopup="true"
        ref={buttonRef}
        onClick={() => setCurrentList(currentList ? null : "baseList")}
      >
        <SettingsIcon aria-hidden="true" />
      </button>
    </div>
  );
};
