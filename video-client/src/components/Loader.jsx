function Loader({ margin }) {
  return <div className="loaderContent" style={margin ? { margin: margin + 'px 0' } : {}}><div className="loader"><div></div><div></div><div></div><div></div></div></div>
}

export default Loader;