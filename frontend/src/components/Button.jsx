import React from "react";
import PropTypes from "prop-types";

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

Button.propTypes = {
  disabledCriteria: PropTypes.bool,
  onClick: PropTypes.func,
  className: PropTypes.string,
  id: PropTypes.string,
  type: PropTypes.string,
  text: PropTypes.string,
};

export default Button;
