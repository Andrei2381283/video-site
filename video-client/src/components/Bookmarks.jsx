import React, { useCallback, useEffect, useRef, useState } from "react";
import { getBookmarks } from "../helpers/bookmarks";

import startImg from "../assets/star.svg";

function Bookmarks({ onSelect }) {
  const [isOpen, setIsOpen] = useState(false);
  const bookmarks = getBookmarks();

  const containerRef = useRef(null);

  const toggle = useCallback(() => setIsOpen(!isOpen), [isOpen, setIsOpen]);
  const close = useCallback(() => setIsOpen(false), [setIsOpen]);

  useEffect(() => {
    const listener = (event) => {
      const path = event.composedPath();
      if (!path.includes(containerRef.current)) close();
    };

    document.addEventListener('click', listener, false);

    return () => document.removeEventListener('click', listener);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <div className="bookmarks" ref={containerRef}>
        <button className="openBookmarks" onClick={toggle}><img src={startImg} width={28} alt="Star"></img> Открыть избранные</button>
        {isOpen && <div className="list bookmarksList">
          {
            bookmarks.map((item, key) => <div key={key} className="searchItem" onClick={() => onSelect(item.id)}>
              <img src={item.poster} width={64} height={93} alt="Poster" />
              <span>{item.name}</span>
            </div>)
          }
        </div>}
      </div>
    </>
  )
}

export default Bookmarks;