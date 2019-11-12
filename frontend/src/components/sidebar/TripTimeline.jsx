import React from 'react';

class TripTimeline extends React.Component {

    render() {

        var detourList = this.props.detourList.map(detour =>
            {
              return (
                <li class="timeline-inverted">
                <div class="timeline-badge hike">
                    <span class="glyphicon glyphicon-search" aria-hidden="true"></span>
                </div>
                <div class="timeline-panel">
                    <div class="timeline-heading">
                    <h5 class="timeline-title">{detour.name}</h5>
                    </div>
                    <p><small class="text-muted">
                            <i class="glyphicon glyphicon-time"></i> 
                            Rating: {detour.rating}
                    </small></p>
                </div>
                </li>
              )
            });

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
                    {detourList}
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