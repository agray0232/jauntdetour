import React from 'react';
import Button from '../Button'

class TimelineItem extends React.Component {
    constructor(){
        super()

        this.removeDetour = this.removeDetour.bind(this);
    }

    removeDetour(){
        if(this.props.detourIndex >= 0){
            this.props.removeDetour(this.props.detourIndex);
        }
    }

    render() {

        var showDetourEditOptions = false;
        if(this.props.type === "detour"){
            showDetourEditOptions = true;
        }

        return (
            <li className="timeline-inverted">
                <div className={this.props.badgeClass}>
                    <span className="glyphicon glyphicon-search" aria-hidden="true"></span>
                </div>
                <div className="timeline-panel">
                    <div className="timeline-heading">
                    <h5 className="timeline-title">{this.props.title}</h5>
                    </div>
                    <p><small className="text-muted">
                            <i className="glyphicon glyphicon-time"></i> 
                            {this.props.mutedText}
                    </small></p>
                    {showDetourEditOptions ? (
                        <Button
                            onClick={this.removeDetour}
                            className = "btn btn-danger btn-clear"
                            type = "button"
                            id = "user-input-clear"
                            text = "Remove">
                        </Button>
                    ): (<div></div>)}
                    
                </div>
            </li>
        )
    }
}

export default TimelineItem;