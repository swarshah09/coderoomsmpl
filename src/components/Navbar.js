import React from "react";
import Select from "react-select";
import "./Styles/Navbar.css";

const Navbar = ({
  userLanguage,
  setUserLanguage,
  userTheme,
  setUserTheme,
  fontSize,
  setFontSize,
}) => {
  const languages = [
    { value: "c", label: "C" },
    { value: "cpp", label: "C++" },
    { value: "python", label: "Python" },
    { value: "java", label: "Java" },
    { value: "javascript", label: "JavaScript" },
  ];

  const themes = [
    { value: "dracula", label: "Dracula" },
    { value: "material", label: "Material" },
    { value: "eclipse", label: "Eclipse" },
  ];

  return (
    <div className="Navbar">
      <div className="leftDiv">
        <div className="title"></div>
        <Select
          options={languages}
          value={languages.find((lang) => lang.value === userLanguage)}
          onChange={(e) => setUserLanguage(e.value)}
        />
        <Select
          options={themes}
          value={themes.find((theme) => theme.value === userTheme)}
          onChange={(e) => setUserTheme(e.value)}
        />
      </div>
      <div className="rightDiv">
        <label>Font Size</label>
        <input
          type="range"
          min="12"
          max="24"
          value={fontSize}
          step="1"
          onChange={(e) => setFontSize(Number(e.target.value))}
        />
      </div>
    </div>
  );
};

export default Navbar;
