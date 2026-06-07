import { ChangeEvent, FormEvent, useMemo, useRef, useState } from "react";
import SearchList from "../SearchList/SearchList";
import debounce from "lodash/debounce";
import styles from "./FilmInput.module.css";

interface FilmInputProps {
  defaultFilm?: string;
  submit: (film: string | number) => void;
}

function FilmInput({ defaultFilm, submit }: FilmInputProps) {
  const [inputValue, setInputValue] = useState(defaultFilm || "");
  const [debouncedInputValue, setDebouncedInputValue] = useState(defaultFilm || "");
  const containerRef = useRef<HTMLDivElement>(null);

  const debouncedSetInputValue = useMemo(
    () => debounce(setDebouncedInputValue, 300),
    [],
  );

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    submit(inputValue);
  };

  const onChange = (event: ChangeEvent<HTMLInputElement>) => {
    setInputValue(event.target.value);
    debouncedSetInputValue(event.target.value);
  };

  return (
    <form className={styles.filmForm} onSubmit={onSubmit}>
      <div className={styles.filmInputDiv} ref={containerRef}>
        <input
          className={styles.filmInput}
          type="text"
          value={inputValue || ""}
          placeholder="Название фильма или ID/ссылка кинопоиск"
          onChange={onChange}
        />
        <SearchList search={debouncedInputValue} onSelect={submit} containerRef={containerRef} />
      </div>
      <button
        className={styles.filmSubmit}
        type="submit"
        disabled={
          Number.isNaN(Number(inputValue)) &&
          !inputValue.match(/kinopoisk.ru\/(?:film|series)\/([0-9]+)\//)
        }
      >
        Поиск
      </button>
    </form>
  );
}

export default FilmInput;
