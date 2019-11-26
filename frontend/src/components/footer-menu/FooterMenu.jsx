import React from 'react';
import $ from 'jquery';

class FooterMenu extends React.Component {

    componentDidMount(){
        $(".footerMenu .open").on("click", function() {
            $(".footerMenu .content").slideToggle();
          });
    }

    render(){
        return(
            <div className="footerMenu">
                <div className="open">open</div>
                <div className="content">content here</div>
            </div>
        )
    }
}

export default FooterMenu;