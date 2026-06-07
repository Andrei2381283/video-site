import styles from "./Loader.module.css";

interface LoaderProps {
  margin?: number;
}

function Loader({ margin }: LoaderProps) {
  return (
    <div
      className={styles.loaderContent}
      style={margin ? { margin: margin + "px 0" } : undefined}
    >
      <div className={styles.loader}>
        <div />
        <div />
        <div />
        <div />
      </div>
    </div>
  );
}

export default Loader;
