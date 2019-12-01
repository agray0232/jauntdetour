(this.webpackJsonpfrontend=this.webpackJsonpfrontend||[]).push([[0],{15:function(t,e){t.exports={NODE_ENV:"production"}},34:function(t,e,r){t.exports=r(77)},39:function(t,e,r){},75:function(t,e,r){},76:function(t,e,r){},77:function(t,e,r){"use strict";r.r(e);var o=r(0),a=r.n(o),s=r(11),i=r.n(s),n=(r(39),r(13)),u=r(1),p=r(2),c=r(4),l=r(3),h=r(5),d=r(6),m=r(10),g=function(t){function e(t){var r;return Object(u.a)(this,e),(r=Object(c.a)(this,Object(l.a)(e).call(this,t))).state={mapStyle:{width:"100%",height:"100%"}},r.adjustMap=r.adjustMap.bind(Object(d.a)(r)),r}return Object(h.a)(e,t),Object(p.a)(e,[{key:"adjustMap",value:function(t,e){if(this.props.route.legth>0){var r=t.google,o=new r.maps.LatLngBounds,a=this.props.route.bounds.northeast.lat,s=this.props.route.bounds.northeast.lng,i=this.props.route.bounds.southwest.lat,n=this.props.route.bounds.southwest.lng;o.extend(new r.maps.LatLng(a,s)),o.extend(new r.maps.LatLng(i,n)),e.fitBounds(o)}}},{key:"render",value:function(){var t=this;if(this.props.showRoute)var e=this.props.route.overview_polyline.complete_overview.map((function(t){return{lat:t[0],lng:t[1]}}));if(this.props.showDetourSearchPoint&&this.props.showRoute){var r={},o=e.length;r=e[Math.floor(this.props.detourSearchLocation/100*o)-1]}var s=!1;if(this.props.detourOptions.length>0){s=!0;var i=this.props.detourOptions.map((function(e){var r=!1;t.props.detourHighlight.forEach((function(t){t.id===e.id&&(r=t.highlight)}));var o={};return o=r?{url:"http://chart.googleapis.com/chart?chst=d_map_spin&chld=1.15|0|FF0000|40|_|%E2%80%A2",scaledSize:new t.props.google.maps.Size(20,30)}:{url:"http://chart.googleapis.com/chart?chst=d_map_spin&chld=1.15|0|0091ff|40|_|%E2%80%A2",scaledSize:new t.props.google.maps.Size(20,30)},a.a.createElement(m.Marker,{position:{lat:e.geometry.location.lat,lng:e.geometry.location.lng},icon:o})}))}var n=!1;if(this.props.detourList.length>0){n=!0;var u=this.props.detourList.map((function(e){var r={url:"http://chart.googleapis.com/chart?chst=d_map_spin&chld=1.15|0|0091ff|40|_|%E2%80%A2",scaledSize:new t.props.google.maps.Size(20,30)};return a.a.createElement(m.Marker,{position:{lat:e.lat,lng:e.lng},icon:r})}))}return a.a.createElement(m.Map,{google:this.props.google,zoom:9,style:this.state.mapStyle,initialCenter:{lat:33.749,lng:-84.388},onReady:this.adjustMap},this.props.showRoute?a.a.createElement(m.Polyline,{defaultPosition:this.props.center,path:e,geodesic:!0,strokeColor:"#007bff",strokeOpacity:1,strokeWeight:5}):a.a.createElement("div",null),this.props.showDetourSearchPoint?a.a.createElement(m.Marker,{position:r,color:"#3349FF"}):a.a.createElement("div",null),this.props.showDetourSearchPoint?a.a.createElement(m.Circle,{radius:parseFloat(this.props.detourSearchRadius),center:r,strokeColor:"transparent",strokeOpacity:0,strokeWeight:5,fillColor:"#FF0000",fillOpacity:.2}):a.a.createElement("div",null),s?i:a.a.createElement("div",null),n?u:a.a.createElement("div",null))}}]),e}(a.a.Component),O=Object(m.GoogleApiWrapper)({apiKey:"AIzaSyArWVAF5NWcXq8RenpdK2vtTZNSX3zaKG4"})(g),f=r(14),v=r.n(f),E=r(15),b=r.n(E),D=function(){function t(){Object(u.a)(this,t)}return Object(p.a)(t,[{key:"getRoute",value:function(t,e,r,o){var a=this.getParameters(t,e,r,o),s=this.getUrlBase()+"/route";return new Promise((function(t,e){v.a.get(s,{headers:{"Content-Type":"application/json"},params:a}).then((function(e){t(e.data)})).catch((function(t){console.log("ERROR: Unable to get response from the server\n User input may be formatted incorrectly"+t.response),e(t)}))}))}},{key:"getParameters",value:function(t,e,r,o){var a={};switch(r){case"Address":a={type:"Address",origin:t,destination:e},o.waypoints&&(a.waypoints=o.waypoints)}return a}},{key:"getUrlBase",value:function(){var t="";switch(b.a.NODE_ENV){case"development":t="http://localhost:8080";break;case"production":t="https://www.jauntdetour.com/backend";break;default:t="https://www.jauntdetour.com/backend"}return t}}]),t}(),y=function(t){function e(){var t;return Object(u.a)(this,e),(t=Object(c.a)(this,Object(l.a)(e).call(this))).requestRoute=t.requestRoute.bind(Object(d.a)(t)),t}return Object(h.a)(e,t),Object(p.a)(e,[{key:"requestRoute",value:function(t){var e=this;t.preventDefault(),console.log("User input being submitted");var r=t.target[0].value,o=t.target[1].value;this.props.setOrigin(r),this.props.setDestination(o),(new D).getRoute(r,o,"Address",{}).then((function(t){t.routes.length>0&&(e.props.setRoute(t.routes[0]),e.props.setTripSummary(t.routes[0].summary))})).catch((function(t){console.log("Error: "+t)}))}},{key:"render",value:function(){return a.a.createElement("div",{className:"user-input container"},a.a.createElement("form",{onSubmit:this.requestRoute},a.a.createElement("div",{className:"form-group "},a.a.createElement("input",{className:"form-control-lg route-input",type:"text",placeholder:"Origin"})),a.a.createElement("div",{className:"form-group"},a.a.createElement("input",{className:"form-control-lg route-input",type:"text",placeholder:"Destination"})),a.a.createElement("div",{className:"form-group "},a.a.createElement("input",{className:"btn-default form-control-lg route-submit",type:"submit",value:"Get Route"}))))}}]),e}(a.a.Component),S=function(t){return a.a.createElement("div",{className:"Button"},a.a.createElement("button",{disabled:t.disabledCriteria,onClick:t.onClick,className:t.className,id:t.id,type:t.type},t.text))},R=function(t){function e(){var t;return Object(u.a)(this,e),(t=Object(c.a)(this,Object(l.a)(e).call(this))).removeDetour=t.removeDetour.bind(Object(d.a)(t)),t.moveUp=t.moveUp.bind(Object(d.a)(t)),t.moveDown=t.moveDown.bind(Object(d.a)(t)),t}return Object(h.a)(e,t),Object(p.a)(e,[{key:"removeDetour",value:function(){var t=this,e=this.props.detourIndex;if(e>=0){var r=this.props.detourList.filter((function(t,r){return r!==e})),o=[];r.forEach((function(t){o.push(t.placeId)})),(new D).getRoute(this.props.origin,this.props.destination,"Address",{waypoints:o}).then((function(e){e.routes.length>0&&(t.props.setRoute(e.routes[0]),t.props.setTripSummary(e.routes[0].summary))})).catch((function(t){console.log("Error: "+t)})),this.props.removeDetour(this.props.detourIndex)}}},{key:"moveUp",value:function(){var t=this,e=this.props.detourIndex;if(e>0){var r=e-1,o=[];this.arrayMove(this.props.detourList,e,r),this.props.detourList.forEach((function(t){o.push(t)}));var a=[];o.forEach((function(t){t.addedTime=-1,a.push(t.placeId)})),(new D).getRoute(this.props.origin,this.props.destination,"Address",{waypoints:a}).then((function(e){e.routes.length>0&&(t.props.setRoute(e.routes[0]),t.props.setTripSummary(e.routes[0].summary))})).catch((function(t){console.log("Error: "+t)})),this.props.setDetourList(o)}}},{key:"moveDown",value:function(){var t=this,e=this.props.detourIndex;if(e!==this.props.detourList.length-1){var r=e+1,o=[];this.arrayMove(this.props.detourList,e,r),this.props.detourList.forEach((function(t){o.push(t)}));var a=[];o.forEach((function(t){t.addedTime=-1,a.push(t.placeId)})),(new D).getRoute(this.props.origin,this.props.destination,"Address",{waypoints:a}).then((function(e){e.routes.length>0&&(t.props.setRoute(e.routes[0]),t.props.setTripSummary(e.routes[0].summary))})).catch((function(t){console.log("Error: "+t)})),this.props.setDetourList(o)}}},{key:"arrayMove",value:function(t,e,r){if(r>=t.length)for(var o=r-t.length+1;o--;)t.push(void 0);t.splice(r,0,t.splice(e,1)[0])}},{key:"render",value:function(){var t=!1;return"detour"===this.props.type&&(t=!0),a.a.createElement("li",{className:"timeline-inverted"},a.a.createElement("div",{className:this.props.badgeClass},a.a.createElement("span",{className:"glyphicon glyphicon-search","aria-hidden":"true"})),a.a.createElement("div",{className:"timeline-panel"},a.a.createElement("div",{className:"timeline-heading"},a.a.createElement("h5",{className:"timeline-title"},this.props.title)),a.a.createElement("div",{className:"timeline-body"},t?a.a.createElement("p",null,a.a.createElement("small",{className:"text-muted"},this.props.mutedText)):a.a.createElement("div",null),t?a.a.createElement("p",null,a.a.createElement("small",{className:"text-muted"},this.props.addedTimeTxt)):a.a.createElement("div",null),t?a.a.createElement("div",null,a.a.createElement("hr",null),a.a.createElement("div",{className:"container detour-edit-options"},a.a.createElement("div",{className:"row"},a.a.createElement("div",{className:"col detour-edit-remove"},a.a.createElement(S,{onClick:this.removeDetour,className:"btn-default btn btn-remove-detour",type:"button",id:"user-input-clear",text:"Remove"})),a.a.createElement("div",{className:"col-3 detour-edit-move"},a.a.createElement("button",{className:"btn detour-arrow-btn",onClick:this.moveUp},a.a.createElement("i",{className:"fa fa-angle-up"})),a.a.createElement("button",{className:"btn detour-arrow-btn",onClick:this.moveDown},a.a.createElement("i",{className:"fa fa-angle-down"})))))):a.a.createElement("div",null))))}}]),e}(a.a.Component),w=function(t){function e(){return Object(u.a)(this,e),Object(c.a)(this,Object(l.a)(e).apply(this,arguments))}return Object(h.a)(e,t),Object(p.a)(e,[{key:"createAddedTimeText",value:function(t){var e="";if(-1!==t.addedTime){var r=Math.floor(t.addedTime/60),o=t.addedTime-60*r,a="",s="";r>0&&(a=r+" hr"),o>0&&(s=o+" min"),e=o>0&&r>0?"+ "+a+" "+s:"+ "+a+s}else e="Time added not calculated - route altered";return e}},{key:"render",value:function(){var t=this.props.detourList.map((function(t,e){var r="Rating: "+t.rating,o=this.createAddedTimeText(t);return a.a.createElement(R,{badgeClass:"timeline-badge hike",title:t.name,mutedText:r,addedTimeTxt:o,type:"detour",detourIndex:e,removeDetour:this.props.removeDetour,setRoute:this.props.setRoute,setTripSummary:this.props.setTripSummary,setDetourList:this.props.setDetourList,detourList:this.props.detourList,origin:this.props.origin,destination:this.props.destination})}),this);return a.a.createElement("div",{className:"container"},a.a.createElement("ul",{className:"timeline"},a.a.createElement(R,{badgeClass:"timeline-badge",title:this.props.origin,type:"origin"}),t,a.a.createElement(R,{badgeClass:"timeline-badge",title:this.props.destination,type:"destination"})))}}]),e}(a.a.Component),j=function(t){function e(){return Object(u.a)(this,e),Object(c.a)(this,Object(l.a)(e).apply(this,arguments))}return Object(h.a)(e,t),Object(p.a)(e,[{key:"render",value:function(){var t=!1;return 0!==Object.entries(this.props.tripSummary).length&&(t=!0),a.a.createElement("div",null,t?a.a.createElement("div",{className:"trip-summary"},a.a.createElement("div",{className:"container"},a.a.createElement("div",{className:"row"},a.a.createElement("div",{className:"col"},a.a.createElement("p",null,"Distance: ",this.props.tripSummary.distance," mi"),a.a.createElement("p",null,"Time: ",this.props.tripSummary.time.hours," hr ",this.props.tripSummary.time.min," min")),a.a.createElement("div",{className:"col-4"},a.a.createElement(S,{onClick:this.props.clearAll,className:"btn btn-danger btn-clear",type:"button",id:"user-input-clear",text:"Clear"})))),a.a.createElement(w,{origin:this.props.origin,destination:this.props.destination,detourList:this.props.detourList,removeDetour:this.props.removeDetour,setRoute:this.props.setRoute,setTripSummary:this.props.setTripSummary,setDetourList:this.props.setDetourList})):a.a.createElement("div",null))}}]),e}(a.a.Component),T=function(t){function e(){return Object(u.a)(this,e),Object(c.a)(this,Object(l.a)(e).apply(this,arguments))}return Object(h.a)(e,t),Object(p.a)(e,[{key:"render",value:function(){var t=this;return a.a.createElement("div",{className:"slide-container"},a.a.createElement("h6",null,"Location"),a.a.createElement("input",{type:"range",min:"1",max:"100",defaultValue:"50",onChange:function(e){return t.props.setDetourSearchLocation(e.target.value)},className:"slider slider-location",id:"myRange"}))}}]),e}(a.a.Component),L=function(t){function e(){return Object(u.a)(this,e),Object(c.a)(this,Object(l.a)(e).apply(this,arguments))}return Object(h.a)(e,t),Object(p.a)(e,[{key:"render",value:function(){var t=this;return a.a.createElement("div",{className:"slidecontainer"},a.a.createElement("h6",null,"Radius"),a.a.createElement("input",{type:"range",min:"1",max:"100000",defaultValue:"20000",onChange:function(e){return t.props.setDetourSearchRadius(e.target.value)},className:"slider",id:"detourRadius"}))}}]),e}(a.a.Component),N=function(){function t(){Object(u.a)(this,t)}return Object(p.a)(t,[{key:"getDetours",value:function(t,e,r,o){var a={searchText:o,lat:t,lng:e,radius:r},s=this.getUrlBase()+"/places";return new Promise((function(t,e){v.a.get(s,{headers:{"Content-Type":"application/json"},params:a}).then((function(e){t(e.data)})).catch((function(t){console.log("ERROR: Unable to get response from the server\n User input may be formatted incorrectly"+t.response),e(t)}))}))}},{key:"getUrlBase",value:function(){var t="";switch(b.a.NODE_ENV){case"development":t="http://localhost:8080";break;case"production":t="https://www.jauntdetour.com/backend";break;default:t="https://www.jauntdetour.com/backend"}return t}}]),t}(),_=function(t){function e(){var t;return Object(u.a)(this,e),(t=Object(c.a)(this,Object(l.a)(e).call(this))).getDetours=t.getDetours.bind(Object(d.a)(t)),t}return Object(h.a)(e,t),Object(p.a)(e,[{key:"getDetours",value:function(){var t=this,e=new N,r=this.props.route.overview_polyline.decodedPoints.map((function(t){return{lat:t[0],lng:t[1]}})),o=r.length,a=r[Math.floor(this.props.detourSearchLocation/100*o)];e.getDetours(a.lat,a.lng,this.props.detourSearchRadius,"Hike").then((function(e){t.props.setDetourOptions(e.results);var r=[];e.results.forEach((function(t){r.push({id:t.id,highlight:!1})})),t.props.setDetourHighlight(r)})).catch((function(t){console.log("Error: "+t)}))}},{key:"render",value:function(){return a.a.createElement("div",{className:"detour-form container"},a.a.createElement("h4",null,"Detour Settings"),a.a.createElement(T,{setDetourSearchLocation:this.props.setDetourSearchLocation}),a.a.createElement(L,{setDetourSearchRadius:this.props.setDetourSearchRadius}),a.a.createElement(S,{onClick:this.getDetours,className:"btn btn-primary main-button",id:"get-detours-button",text:"Get detours"}))}}]),e}(a.a.Component),k=function(t){function e(){var t;return Object(u.a)(this,e),(t=Object(c.a)(this,Object(l.a)(e).call(this))).addDetour=t.addDetour.bind(Object(d.a)(t)),t.highlight=t.highlight.bind(Object(d.a)(t)),t}return Object(h.a)(e,t),Object(p.a)(e,[{key:"highlight",value:function(){var t=this,e=[];this.props.detourHighlight.forEach((function(r){var o=!1;r.id===t.props.id&&(o=!0),e.push({id:r.id,highlight:o})})),this.props.setDetourHighlight(e)}},{key:"calcAddedTime",value:function(t){var e=60*this.props.tripSummary.time.hours+this.props.tripSummary.time.min;return 60*t.time.hours+t.time.min-e}},{key:"addDetour",value:function(){var t=this,e=[],r=0;this.props.detourList.forEach((function(t){e.push(t.placeId)})),e.push(this.props.placeId),(new D).getRoute(this.props.origin,this.props.destination,"Address",{waypoints:e}).then((function(e){e.routes.length>0&&(t.props.setRoute(e.routes[0]),r=t.calcAddedTime(e.routes[0].summary),t.props.setTripSummary(e.routes[0].summary),t.props.clearDetourOptions()),t.props.addDetour({name:t.props.name,lat:t.props.lat,lng:t.props.lng,id:t.props.id,rating:t.props.rating,placeId:t.props.placeId,addedTime:r})})).catch((function(t){console.log("Error: "+t)}))}},{key:"render",value:function(){return a.a.createElement("li",{onMouseEnter:this.highlight,className:"list-group-item list-group-hover",key:this.props.id.toString()},a.a.createElement("div",{className:"row"},a.a.createElement("div",{className:"col"},a.a.createElement("h5",null,this.props.name),a.a.createElement("p",null,"Rating: ",this.props.rating)),a.a.createElement("div",{className:"col-3"},a.a.createElement(S,{onClick:this.addDetour,className:"btn detour-option-btn",id:"{this.name}-detour-button",text:"+"}))))}}]),e}(a.a.Component),C=function(t){function e(){return Object(u.a)(this,e),Object(c.a)(this,Object(l.a)(e).apply(this,arguments))}return Object(h.a)(e,t),Object(p.a)(e,[{key:"render",value:function(){var t=this,e=this.props.detourOptions.map((function(e){var r=e.geometry.location.lat,o=e.geometry.location.lng,s=e.id,i=e.place_id;return a.a.createElement(k,{detourOptions:t.props.detourOptions,detourList:t.props.detourList,detourHighlight:t.props.detourHighlight,origin:t.props.origin,destination:t.props.destination,tripSummary:t.props.tripSummary,name:e.name,lat:r,lng:o,id:s,rating:e.rating,placeId:i,setRoute:t.props.setRoute,setTripSummary:t.props.setTripSummary,addDetour:t.props.addDetour,setDetourOptions:t.props.setDetourOptions,setDetourHighlight:t.props.setDetourHighlight,clearDetourOptions:t.props.clearDetourOptions})}));return a.a.createElement("div",{className:"detour-options"},a.a.createElement("div",{className:"container"},a.a.createElement("h4",null,"Detour Options")),a.a.createElement("ul",{className:"detour-options-list list-group"},e))}}]),e}(a.a.Component),A=function(t){function e(){return Object(u.a)(this,e),Object(c.a)(this,Object(l.a)(e).apply(this,arguments))}return Object(h.a)(e,t),Object(p.a)(e,[{key:"render",value:function(){return a.a.createElement("div",{className:"side-bar"},a.a.createElement(y,{origin:this.props.origin,destination:this.props.destination,setOrigin:this.props.setOrigin,setDestination:this.props.setDestination,setRoute:this.props.setRoute,setTripSummary:this.props.setTripSummary}),a.a.createElement(j,{origin:this.props.origin,destination:this.props.destination,tripSummary:this.props.tripSummary,detourList:this.props.detourList,removeDetour:this.props.removeDetour,setRoute:this.props.setRoute,setTripSummary:this.props.setTripSummary,setDetourList:this.props.setDetourList,clearAll:this.props.clearAll}),this.props.showDetourForm?a.a.createElement(_,{setDetourSearchLocation:this.props.setDetourSearchLocation,setDetourSearchRadius:this.props.setDetourSearchRadius,setDetourOptions:this.props.setDetourOptions,setDetourHighlight:this.props.setDetourHighlight,detourSearchLocation:this.props.detourSearchLocation,detourSearchRadius:this.props.detourSearchRadius,route:this.props.route}):a.a.createElement("div",{className:"container add-detour-container"},a.a.createElement(S,{disabledCriteria:!this.props.showDetourButton,onClick:this.props.getDetourForm,className:"btn btn-primary add-detour-btn",id:"add-detour-button",text:"+ Add Detour"})),this.props.showDetourOptions?a.a.createElement(C,{origin:this.props.origin,destination:this.props.destination,tripSummary:this.props.tripSummary,detourOptions:this.props.detourOptions,detourList:this.props.detourList,detourHighlight:this.props.detourHighlight,addDetour:this.props.addDetour,setRoute:this.props.setRoute,setTripSummary:this.props.setTripSummary,setDetourOptions:this.props.setDetourOptions,setDetourHighlight:this.props.setDetourHighlight,clearDetourOptions:this.props.clearDetourOptions}):a.a.createElement("div",null))}}]),e}(a.a.Component),I=function(t){function e(){return Object(u.a)(this,e),Object(c.a)(this,Object(l.a)(e).apply(this,arguments))}return Object(h.a)(e,t),Object(p.a)(e,[{key:"render",value:function(){return a.a.createElement("div",{className:"app-container row"},a.a.createElement(A,{origin:this.props.origin,destination:this.props.destination,tripSummary:this.props.tripSummary,setOrigin:this.props.setOrigin,setDestination:this.props.setDestination,setRoute:this.props.setRoute,setTripSummary:this.props.setTripSummary,setDetourSearchLocation:this.props.setDetourSearchLocation,setDetourSearchRadius:this.props.setDetourSearchRadius,setDetourOptions:this.props.setDetourOptions,setDetourHighlight:this.props.setDetourHighlight,setDetourList:this.props.setDetourList,detourSearchLocation:this.props.detourSearchLocation,detourSearchRadius:this.props.detourSearchRadius,addDetour:this.props.addDetour,removeDetour:this.props.removeDetour,detourList:this.props.detourList,route:this.props.route,showDetourButton:this.props.showDetourButton,showDetourForm:this.props.showDetourForm,showDetourOptions:this.props.showDetourOptions,getDetourForm:this.props.getDetourForm,detourOptions:this.props.detourOptions,detourHighlight:this.props.detourHighlight,clearDetourOptions:this.props.clearDetourOptions,clearAll:this.props.clearAll}),a.a.createElement("div",{className:"map-container"},a.a.createElement(O,{showRoute:this.props.showRoute,showDetourSearchPoint:this.props.showDetourSearchPoint,detourSearchLocation:this.props.detourSearchLocation,detourSearchRadius:this.props.detourSearchRadius,detourOptions:this.props.detourOptions,detourHighlight:this.props.detourHighlight,detourList:this.props.detourList,route:this.props.route})))}}]),e}(a.a.Component),P=r(17);function H(t,e){var r=Object.keys(t);if(Object.getOwnPropertySymbols){var o=Object.getOwnPropertySymbols(t);e&&(o=o.filter((function(e){return Object.getOwnPropertyDescriptor(t,e).enumerable}))),r.push.apply(r,o)}return r}var U=Object(P.b)((function(t){return function(t){for(var e=1;e<arguments.length;e++){var r=null!=arguments[e]?arguments[e]:{};e%2?H(r,!0).forEach((function(e){Object(n.a)(t,e,r[e])})):Object.getOwnPropertyDescriptors?Object.defineProperties(t,Object.getOwnPropertyDescriptors(r)):H(r).forEach((function(e){Object.defineProperty(t,e,Object.getOwnPropertyDescriptor(r,e))}))}return t}({},t)}),(function(t){return{setOrigin:function(e){return t({type:"SET_ORIGIN",data:{origin:e}})},setDestination:function(e){return t({type:"SET_DESTINATION",data:{destination:e}})},setRoute:function(e){return t({type:"SET_ROUTE",data:{route:e}})},setTripSummary:function(e){return t({type:"SET_TRIP_SUMMARY",data:{tripSummary:e}})},getDetourForm:function(){return t({type:"GET_DETOUR_FORM"})},setDetourSearchLocation:function(e){return t({type:"SET_DETOUR_SEARCH_LOCATION",data:{detourSearchLocation:e}})},setDetourSearchRadius:function(e){return t({type:"SET_DETOUR_SEARCH_RADIUS",data:{detourSearchRadius:e}})},setDetourOptions:function(e){return t({type:"SET_DETOUR_OPTIONS",data:{detourOptions:e}})},setDetourHighlight:function(e){return t({type:"SET_DETOUR_HIGHLIGHT",data:{detourHighlight:e}})},clearDetourOptions:function(){return t({type:"CLEAR_DETOUR_OPTIONS"})},addDetour:function(e){return t({type:"ADD_DETOUR",data:{detour:e}})},removeDetour:function(e){return t({type:"REMOVE_DETOUR",data:{index:e}})},setDetourList:function(e){return t({type:"SET_DETOUR_LIST",data:{detourList:e}})},clearAll:function(){return t({type:"CLEAR_ALL"})}}}))(I);r(75),r(76);var x=function(){return a.a.createElement("div",null,a.a.createElement(U,null))};Boolean("localhost"===window.location.hostname||"[::1]"===window.location.hostname||window.location.hostname.match(/^127(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/));var M=r(16),F=r(33);function B(t,e){var r=Object.keys(t);if(Object.getOwnPropertySymbols){var o=Object.getOwnPropertySymbols(t);e&&(o=o.filter((function(e){return Object.getOwnPropertyDescriptor(t,e).enumerable}))),r.push.apply(r,o)}return r}function G(t){for(var e=1;e<arguments.length;e++){var r=null!=arguments[e]?arguments[e]:{};e%2?B(r,!0).forEach((function(e){Object(n.a)(t,e,r[e])})):Object.getOwnPropertyDescriptors?Object.defineProperties(t,Object.getOwnPropertyDescriptors(r)):B(r).forEach((function(e){Object.defineProperty(t,e,Object.getOwnPropertyDescriptor(r,e))}))}return t}var z={origin:"",destination:"",detourList:[],tripSummary:{},route:[],routeOptions:[],detourOptions:[],detourHighlight:[],detourSearchLocation:50,detourSearchRadius:2e4,showRoute:!1,showDetourButton:!1,showDetourForm:!1,showDetourOptions:!1,showDetourSearchPoint:!1},V=function(){var t=arguments.length>0&&void 0!==arguments[0]?arguments[0]:z,e=arguments.length>1?arguments[1]:void 0;switch(e.type){case"SET_ORIGIN":return G({},t,{origin:e.data.origin});case"SET_DESTINATION":return G({},t,{destination:e.data.destination});case"SET_ROUTE":return G({},t,{showRoute:!0,showDetourButton:!0,route:e.data.route});case"SET_TRIP_SUMMARY":return G({},t,{tripSummary:e.data.tripSummary});case"GET_DETOUR_FORM":return G({},t,{showDetourForm:!0,showDetourSearchPoint:!0});case"SET_DETOUR_SEARCH_LOCATION":return G({},t,{detourSearchLocation:e.data.detourSearchLocation});case"SET_DETOUR_SEARCH_RADIUS":return G({},t,{detourSearchRadius:e.data.detourSearchRadius});case"SET_DETOUR_OPTIONS":return G({},t,{detourOptions:e.data.detourOptions,showDetourOptions:!0});case"SET_DETOUR_HIGHLIGHT":return G({},t,{detourHighlight:e.data.detourHighlight});case"CLEAR_DETOUR_OPTIONS":return G({},t,{detourOptions:[],detourRadius:0,showDetourForm:!1,showDetourOptions:!1,showDetourSearchPoint:!1});case"ADD_DETOUR":return G({},t,{detourList:[].concat(Object(F.a)(t.detourList),[e.data.detour])});case"REMOVE_DETOUR":var r=t.detourList.filter((function(t,r){return r!==e.data.index}));return G({},t,{detourList:r});case"SET_DETOUR_LIST":return G({},t,{detourList:e.data.detourList});case"CLEAR_ALL":return{origin:"",destination:"",detourList:[],tripSummary:{},route:[],routeOptions:[],detourOptions:[],detourHighlight:[],detourSearchLocation:50,detourSearchRadius:2e4,showRoute:!1,showDetourButton:!1,showDetourForm:!1,showDetourOptions:!1,showDetourSearchPoint:!1};default:return t}},W=Object(M.b)(V);i.a.render(a.a.createElement(P.a,{store:W},a.a.createElement(x,null)),document.getElementById("root")),"serviceWorker"in navigator&&navigator.serviceWorker.ready.then((function(t){t.unregister()}))}},[[34,1,2]]]);
//# sourceMappingURL=main.ff2d2d41.chunk.js.map