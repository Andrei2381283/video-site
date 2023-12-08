import { useMemo, useRef, useState } from "react";
import SearchList from "./SearchList";
import { debounce } from "lodash";

function FilmInput({ defaultFilm, submit }) {

  const [inputValue, setInputValue] = useState(defaultFilm || '');
  const [debouncedInputValue, setDebouncedInputValue] = useState(defaultFilm || '');
  const containerRef = useRef(null);

  const debouncedSetInputValue = useMemo(() => debounce(setDebouncedInputValue, 300), [setDebouncedInputValue])

  const onSubmit = (event) => {
    event.preventDefault();
    submit(inputValue);
  }

  const onChange = (event) => {
    setInputValue(event.target.value);
    debouncedSetInputValue(event.target.value);
  }

  return (
    <form className="filmForm" onSubmit={onSubmit}>
      <div className="filmInputDiv" ref={containerRef}>
        <input className="filmInput" type="text" value={inputValue || ""} placeholder="Название фильма или ID/ссылка кинопоиск" onChange={onChange} />
        <SearchList search={debouncedInputValue} onSelect={submit} containerRef={containerRef} />
      </div>
      <button className="filmSubmit" type="submit" disabled={isNaN(Number(inputValue)) && !inputValue.match(/kinopoisk.ru\/(?:film|series)\/([0-9]+)\//)}>Поиск</button>
    </form>
  )
}

export default FilmInput;