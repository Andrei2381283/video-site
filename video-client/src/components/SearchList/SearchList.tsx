import { MouseEvent, RefObject, useCallback, useEffect, useState } from "react";
import Loader from "../Loader/Loader";
import { useSearchQuery } from "../../queries/search";
import styles from "./SearchList.module.css";

interface SearchListProps {
  search: string;
  onSelect: (id: number) => void;
  containerRef: RefObject<HTMLElement | null>;
}

function SearchList({ search, onSelect, containerRef }: SearchListProps) {
  const { data: result = [], isLoading } = useSearchQuery(search);
  const [isClosed, setClosed] = useState(true);

  useEffect(() => {
    const listener = (event: globalThis.MouseEvent) => {
      const path = event.composedPath();
      setClosed(!containerRef.current || !path.includes(containerRef.current));
    };

    document.addEventListener("click", listener, false);

    return () => document.removeEventListener("click", listener);
  }, [containerRef]);

  const onSelectHandle = useCallback(
    (id: number) => (event: MouseEvent<HTMLDivElement>) => {
      event.stopPropagation();
      setClosed(true);
      onSelect(id);
    },
    [onSelect],
  );

  if (!search || isClosed) return null;

  return (
    <div className={[styles.list, styles.searchList].join(" ")}>
      {isLoading && <Loader />}
      {!isLoading &&
        result.map((item) => (
          <div key={item.id} className={styles.searchItem} onClickCapture={onSelectHandle(item.id)}>
            {item.poster && <img src={item.poster} width={64} height={93} alt="Poster" />}
            <span>{item.name}</span>
          </div>
        ))}
      {!result.length && !isLoading && <span>??? ???????????</span>}
    </div>
  );
}

export default SearchList;
