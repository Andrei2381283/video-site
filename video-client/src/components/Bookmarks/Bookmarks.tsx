import { useCallback, useEffect, useRef, useState } from "react";
import { getBookmarks } from "../../helpers/bookmarks";
import startImg from "../../assets/star.svg";
import styles from "./Bookmarks.module.css";

interface BookmarksProps {
  onSelect: (id: number) => void;
}

function Bookmarks({ onSelect }: BookmarksProps) {
  const [isOpen, setIsOpen] = useState(false);
  const bookmarks = getBookmarks();
  const containerRef = useRef<HTMLDivElement>(null);
  const toggle = useCallback(() => setIsOpen((value) => !value), []);
  const close = useCallback(() => setIsOpen(false), []);

  useEffect(() => {
    const listener = (event: MouseEvent) => {
      const path = event.composedPath();
      if (!containerRef.current || !path.includes(containerRef.current)) close();
    };

    document.addEventListener("click", listener, false);

    return () => document.removeEventListener("click", listener);
  }, [close]);

  return (
    <div className={styles.bookmarks} ref={containerRef}>
      <button className={styles.openBookmarks} onClick={toggle}>
        <img src={startImg} width={28} alt="Star" /> Открыть избранные
      </button>
      {isOpen && (
        <div className={styles.bookmarksList}>
          {bookmarks.map((item) => (
            <div key={item.id} className={styles.bookmarkItem} onClick={() => onSelect(item.id)}>
              {item.poster && <img src={item.poster} width={64} height={93} alt="Poster" />}
              <span>{item.name}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Bookmarks;
