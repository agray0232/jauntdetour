import React from 'react';

let Button = (props) => {
    return (
        <div className="Button">
            <button 
                disabled={props.disabledCriteria}
                onClick={props.onClick} 
                className={props.class}
                id={props.id}>
                {props.text}
            </button>
        </div>
    )
}

export default Button;