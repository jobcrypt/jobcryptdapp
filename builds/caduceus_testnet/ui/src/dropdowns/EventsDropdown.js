import { useNavigate } from 'react-router-dom';


import classes from '../styles/dropdowns/EventsDropdown.module.css';

const EventsDropdown = (props) =>{
    const { setShowHamburger } = props;
 const navigate = useNavigate();


    const navigateToPage = (path) =>{
        navigate(path);
        setShowHamburger(false);
    }

    const openUrl = (url) =>{
        window.open(url);
    }

    return(
        <ul className={classes.ul}>
            <li onClick={()=>navigateToPage('/featured-events')}>Featured Event</li>
            <li onClick={()=>openUrl('https://events.jobcrypt.com/blockchainsustainabilityweekuk2023/')}>Blockchain Sustainable Week - UK 2023</li>
            <li onClick={()=>openUrl('https://events.jobcrypt.com/blockchainsustainabilityweekeu2023/')}>Blockchain Sustainable Week - EU 2023</li>
            <li onClick={()=>navigateToPage('/events_calendar')}>2023 Event Calendar</li>
        </ul>
    )
}

export default EventsDropdown;