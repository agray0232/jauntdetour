import React from 'react';

class TripTimeline extends React.Component {

    render() {
        return (
            <div class="container">
                <ul class="timeline">
                    <li class="timeline-inverted">
                    <div class="timeline-badge">
                        <span class="glyphicon glyphicon-search" aria-hidden="true"></span>
                    </div>
                    <div class="timeline-panel">
                        <div class="timeline-heading">
                        <h5 class="timeline-title">{this.props.origin}</h5>
                        </div>
                    </div>
                    </li>
                    <li class="timeline-inverted">
                    <div class="timeline-badge"><i class="glyphicon glyphicon-credit-card"></i></div>
                    <div class="timeline-panel">
                        <div class="timeline-heading">
                        <h5 class="timeline-title">{this.props.destination}</h5>
                        </div>
                    </div>
                    </li>
                </ul>
            </div>
        )
    }
}

export default TripTimeline;