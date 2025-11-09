import React from "react";

let Button = (props) => {
  return (
    <div className="Button">
      <button
        disabled={props.disabledCriteria}
        onClick={props.onClick}
        className={props.className}
        id={props.id}
        type={props.type}
      >
        {props.text}
      </button>
    </div>
  );
};

export default Button;
