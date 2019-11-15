import React from 'react';

class TimelineItem extends React.Component {

    render() {
        return (
            <li class="timeline-inverted">
                <div class={this.props.badgeClass}>
                    <span class="glyphicon glyphicon-search" aria-hidden="true"></span>
                </div>
                <div class="timeline-panel">
                    <div class="timeline-heading">
                    <h5 class="timeline-title">{this.props.title}</h5>
                    </div>
                    <p><small class="text-muted">
                            <i class="glyphicon glyphicon-time"></i> 
                            {this.props.mutedText}
                    </small></p>
                </div>
            </li>
        )
    }
}

export default TimelineItem;