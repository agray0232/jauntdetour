import React from 'react';
import $ from 'jquery';
import TripSummary from '../sidebar/TripSummary'

class FooterMenu extends React.Component {

    componentDidMount(){
        $(".footerMenu .open").on("click", function() {
            $(".footerMenu .content").slideToggle("fast");
          });
    }

    render(){
        return(
            <div className="footerMenu">
                <div className="open">open</div>
                <div className="content">
                    <TripSummary
                        origin = {this.props.origin}
                        destination = {this.props.destination}
                        tripSummary = {this.props.tripSummary}
                        detourList = {this.props.detourList}
                        removeDetour = {this.props.removeDetour}
                        setRoute = {this.props.setRoute}
                        setTripSummary = {this.props.setTripSummary}
                        setDetourList = {this.props.setDetourList}
                        clearAll = {this.props.clearAll}>
                    </TripSummary>
                </div>
            </div>
        )
    }
}

export default FooterMenu;