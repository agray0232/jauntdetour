import React from "react";
import PropTypes from "prop-types";
import mark from "../assets/brand/jauntdetour-mark.svg";

export default function BrandMark({ className, size, decorative }) {
  return (
    <img
      alt={decorative ? "" : "JauntDetour"}
      aria-hidden={decorative ? "true" : undefined}
      className={className}
      height={size}
      src={mark}
      width={size}
    />
  );
}

BrandMark.propTypes = {
  className: PropTypes.string,
  decorative: PropTypes.bool,
  size: PropTypes.number,
};

BrandMark.defaultProps = {
  className: undefined,
  decorative: false,
  size: 32,
};
