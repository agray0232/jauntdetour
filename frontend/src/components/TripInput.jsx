import React from 'react';

class TripInput extends React.Component {

    render() {
        
        return (
            <form>
              Origin: <input type="text"/>
              Destination: <input type="text"/>
            <input type="submit" value="Submit" />
          </form>
        )
    }
}

export default TripInput;