import { useCallback, useContext, useEffect, useReducer, useRef, useState } from 'react';
import Moment from 'react-moment';
import DOMPurify from 'dompurify';

import classes from '../styles/components/BrowseJobs.module.css';
import searchIcon from '../assets/search.png';
import briefcase from '../assets/briefcase.png';
import skillIcon from '../assets/skills.png';
import designIcon from '../assets/categories.png';
import location2 from '../assets/pin.png';
import moreIcon from '../assets/more.png';
import backIcon from '../assets/back2.png';
import StakePopup from '../popups/StakePopup';
import ApplyForJobPopup from '../popups/ApplyForJobPopup';
import { isNull } from '../utils/Util';
import { getProvider } from '../contracts/init';
import useWindowSize from '../hooks/useWindowSize';
import { approveStake, getIsStaked, searchJob, stake } from '../contracts/ContractManager';
import { getFeaturedJobs } from '../jobManager/FeaturedJobs';
import { getLatestJobDetails, getLatestJobs } from '../jobManager/LatestJobs';
import Spinner from './Spinner';
import Wrapper from './Wrapper';
import { getPopularJobs } from '../jobManager/PopularJobs';
import { AccountContext } from '../App';
import { useLocation, useNavigate } from 'react-router-dom';
import ReceiptPopup from '../popups/ReceiptPopup';



const FEATURED = 'FEATURED';
const LATEST = 'LATEST';
const POPULAR = 'POPULAR';


const initialState = {
    featured: false,
    latest: true,
    popular: false
}

const reducerFunc = (state, action) =>{
    switch(action.TYPE){
        case FEATURED:
            return{
                featured: true,
                latest: false,
                popular: false
            }
        case LATEST:
            return{
                featured: false,
                latest: true,
                popular: false
            }
        case POPULAR:
            return{
                featured: false,
                latest: false,
                popular: true
            }
        default:
            return state;
    }
}

let isDone = false, isRunning = false;
const BrowseJobs = () =>{
    const [ dispatch, setDispatch ] = useReducer(reducerFunc, initialState);
    const [ openStakePopup, setOpenStakePopup] = useState(false);
    const [ apply, setApply ] = useState(false);
    const width = useWindowSize();
    const [ showJobDesc, setShowJobDesc ] = useState(false);
    const offset = useRef(0);
    const [ popularJobArray, setPopularJobArray ] = useState([]);
    const [ latestJobArray, setLatestJobArray ] = useState([]);
    const [ featuredJobArray, setFeaturedJobArray ] = useState([]);
    const [ isLoading, setIsLoading ] = useState({ status: false, message: '' });
    const [ jobDetails, setJobDetails ] = useState(null);
    const [ isLoadingJobDesc, setIsLoadingJobDesc ] = useState({ status: false, message: '' });
    const { isStaked, account, isApproved, setIsApproved, setIsStaked } = useContext(AccountContext);
    const [ selectedPostingAddress, setSelectedPostingAddress ] = useState(undefined);
    const searchRef = useRef();
    const navigate = useNavigate();
    const location = useLocation();
    const dialogRef = useRef();
    const [ showReceipt, setShowReceipt ] = useState({ hash: '', type: '', isVisible: false });


    const approveHandler = async() =>{
        if(isRunning)return;
        isRunning = true;
        const approve = await approveStake();
        // console.log(approve)
        // console.log('hash: ',approve.hash);
        const wait = await getProvider().waitForTransaction(approve.hash);
        if(!isNull(wait) && wait.status ===1){
            setIsApproved(true);
        }else{
            setIsApproved(false);
        }
       isRunning = false;
    }
    
    const stakeHandler = useCallback(async() =>{
        if(isRunning)return;
        isRunning = true;
        // console.log('is approved: ', isApproved);
        const staked = await stake();
        const wait = await getProvider().waitForTransaction(staked.hash);
        if(!isNull(wait) && wait.status ===1){
            setIsStaked(true);
        }else{
            setIsStaked(false);
        }
        setShowReceipt({ hash: staked.hash, type: 'Gas Fee', isVisible: true }); 
        // setOpenStakePopup(true);
       isRunning = false;
    },[]);


    useEffect(()=>{
        document.getElementById('previous_application').scrollIntoView({ behavior: "smooth" });
    },[]);


    const fetchFeaturedJobs = useCallback(async() =>{
        isDone = false;
        setIsLoading({ status: true, message: 'Loading Featured Jobs, please wait...'})
       const jobs = await getFeaturedJobs(offset.current);
       isDone = true;
       if(!isNull(jobs)){
        ++offset.current;
        setFeaturedJobArray(jobs);
       }

       setIsLoading({ status: false, message: ''});
    //    console.log('Featured Jobs Addresses: ', jobs);

    },[]);

    const fetchLatestJobs = useCallback(async() =>{
        isDone = false;
        setIsLoading({ status: true, message: 'Loading Latest Jobs, please wait...'})
        const jobs = await getLatestJobs(offset.current);
        isDone = true;
        if(!isNull(jobs)){
            ++offset.current;
            setLatestJobArray(jobs);
        }

        setIsLoading({ status: false, message: ''})
        // console.log('Latest Jobs Addresses: ', jobs);
    
        },[]);

    const fetchPopularJobs = useCallback(async() =>{
        isDone = false;
        setIsLoading({ status: true, message: 'Loading Popular Jobs, please wait...'})
        const jobs = await getPopularJobs(offset.current);
        isDone = true;
        if(!isNull(jobs)){
            ++offset.current;
            setPopularJobArray(jobs);
        }

        setIsLoading({ status: false, message: ''})
        // console.log('popular Jobs Addresses: ', jobs);
    
    },[]);

    useEffect(()=>{
       (async()=>{
        const isStaked = await getIsStaked();
        setIsStaked(isStaked)
       })();

        if(!account.isConnected){
            setFeaturedJobArray([]);
            setLatestJobArray([]);
            setPopularJobArray([]);
            setJobDetails(null);
            return;
        }

        if(isNull(location.state)){
            setDispatch({ TYPE: LATEST });
            fetchLatestJobs();
        }else{
            if(location.state.tab === 'featured'){
                setDispatch({ TYPE: FEATURED });
                fetchFeaturedJobs();
            }
            if(location.state.tab === 'latest'){
                setDispatch({ TYPE: LATEST });
                fetchLatestJobs();
            }
            if(location.state.tab === 'popular'){
                setDispatch({ TYPE: POPULAR });
                fetchPopularJobs();
            }
        }
    },[fetchLatestJobs, account.isConnected, location.state]);


    const selectedJobHandler = (type)=>{
        // console.log('isDone: ', isDone)
    
        // if(isDone){
        if(type === 'featured' && !dispatch.featured && account.isConnected){
            setDispatch({ TYPE: FEATURED });
            offset.current = 0;
            setFeaturedJobArray([]);
            fetchFeaturedJobs();
            setJobDetails();
        }
        if(type === 'latest' && !dispatch.latest && account.isConnected){
            setDispatch({ TYPE: LATEST });
            offset.current = 0;
            setLatestJobArray([]);
            fetchLatestJobs();
            setJobDetails();
        }
        if(type === 'popular' && !dispatch.popular && account.isConnected){
            setDispatch({ TYPE: POPULAR  });
            offset.current = 0;
            setPopularJobArray([]);
            fetchPopularJobs();
            setJobDetails();
        }
    // }
    }

    const fetchJobDetailsHandler = async(postingAddress) =>{
        console.log(postingAddress)
        setSelectedPostingAddress(postingAddress);
        setJobDetails(null);
        setShowJobDesc(true);//only for mobile
        setIsLoadingJobDesc({ status: true, message: 'Loading job details...' });
        // console.log('user staked: ', isStaked);
        const result_ = await getLatestJobDetails(postingAddress);
        if(!isNull(result_[0])){
            const result = result_[0];
        setJobDetails({
            jobTitle: result.jobTitle,
            companyName: result.companyName,
            companyLink: result.companyLink,
            workType: result.workType,
            locationType: result.locationType,
            postingDateFeatures: result.postingDateFeatures,
            companySummary: result.companySummary,
            jobPaymentType: result.jobPaymentType,
            jobLocationSupport: result.jobLocationSupport,
            categoryFeature: result.categoryFeature,
            skillsFeature: result.skillsFeature,
            jobDesc: result.jobDesc,
        });
        // console.log('job details: ', result);
    }

    setIsLoadingJobDesc({ status: false, message: 'Sorry, couldn\'t load this job detail.' });
}

const openCompanyUrl =() =>{
    if(!isStaked)return;
    setApply(true);
    if(!dialogRef.current.open){
        dialogRef.current.showModal();
    }
    // if(!isNull(url)){
    //   if(!url.startsWith('http') || !url.startsWith('https')) url = `https://${url}`
    //      window.open(url);
    // } 
}

function getJobTitle(title){
    return (isNull(title)? '' : (title.length > 17)? title.slice(0,17)+'...' : title)
}

const reloadJobsHandler = () =>{
    if(dispatch.featured)fetchFeaturedJobs()
    if(dispatch.latest)fetchLatestJobs();
    if(dispatch.popular)fetchPopularJobs();
}

const handleSearch = async() =>{
    console.log('search active')
   if(isNull(searchRef.current.value))return;
   const result = await searchJob(searchRef.current.value.toLowerCase());
}

const style={
     color: '#fff',
     backgroundColor: '#2E2230',
     borderColor: '#fff',
    }

//  function header(){
//     let element;
//     if(isNull(jobDetails)){
//         element = (
//             <header className={classes.jobTitleColored}>
//             <div className={classes.jobTitleColoredDivLeft}>
//                 <h1>--</h1>
//                 <div className={classes.jobTitleNameContainer}>
//                     <span></span>
//                     <p>--</p>
//                 </div>
//             </div>
//             <div className={classes.jobTitleColoredDivRight}>
//             <p></p>
//             </div>
//         </header>
//         )
//     }else{
//      element = (
//         <header className={classes.jobTitleColored}>
//             <div className={classes.jobTitleColoredDivLeft}>
//                 <h1>{jobDetails.jobTitle}</h1>
//                 <div className={classes.jobTitleNameContainer}>
//                     <span>{jobDetails.companyName.slice(0,1)}</span>
//                     <p>{jobDetails.companyName}</p>
//                 </div>
//             </div>
//             <div className={classes.jobTitleColoredDivRight}>
//                 {!isStaked &&<p onClick={stakeHandler}>Please stake to apply</p>}
//                 {isStaked &&<button onClick={()=>setApply(true)} className={classes.applyNowBtn}>Apply Now</button>}
//             </div>
//         </header>
//     )
//     }

//      return element;
//  }

//  function headerMobile(){
//     let element;
//     if(isNull(jobDetails)){
//         element = (
//             <header className={classes.jobTitleColored}>
//             <div className={classes.backwardIconContainer}>
//                 <img src={backIcon} alt='' className={classes.backIcon} onClick={()=>setShowJobDesc(false)} />
//             </div>
//                 <div className={classes.jobTitleColoredDivLeft}>
//                     <h1>--</h1>
//                     <div className={classes.jobTitleNameContainer}>
//                         <span></span>
//                         <p>--</p>
//                     </div>
//                 </div>
//                 <div className={classes.jobTitleColoredDivRight}>
//                     {/* <p></p> */}
//                 </div>
//             </header>
//         )
//     }else{
//        element=(
//         <header className={classes.jobTitleColored}>
//         <div className={classes.backwardIconContainer}>
//             <img src={backIcon} alt='' className={classes.backIcon} onClick={()=>setShowJobDesc(false)} />
//         </div>
//             <div className={classes.jobTitleColoredDivLeft}>
//                 <h1>{jobDetails.jobTitle}</h1>
//                 <div className={classes.jobTitleNameContainer}>
//                     <span>{jobDetails.companyName.slice(0,1)}</span>
//                     <p>{jobDetails.companyName}</p>
//                 </div>
//             </div>
//             <div className={classes.jobTitleColoredDivRight}>
//                 {!isStaked &&<p onClick={stakeHandler}>Please stake to apply</p>}
//                 {isStaked &&<button onClick={()=>setApply(true)} className={classes.applyNowBtn}>Apply Now</button>}
//             </div>
//         </header>
//        )
//     }

//     return element;
//  }

    const desktop = (
        <>
        <main className={classes.leftSide}>
        {/* <h2 className={classes.jobCount}>390 Design Jobs available in London, UK</h2> */}
            <header className={classes.top}>
                <nav className={classes.nav}>
                    <button 
                        onClick={()=>selectedJobHandler('featured')} 
                        className={`${classes.jobTypeBtn} ${dispatch.featured&& classes.selected}`}>Featured Jobs</button>
                    <button 
                        onClick={()=>selectedJobHandler('latest')} 
                        className={`${classes.jobTypeBtn} ${dispatch.latest && classes.selected}`}>Latest Jobs</button>
                    <button 
                        onClick={()=>selectedJobHandler('popular')} 
                        className={`${classes.jobTypeBtn} ${dispatch.popular && classes.selected }`}>Popular Jobs</button>
                </nav>
            </header>
            {dispatch.featured &&<>
            {(isNull(featuredJobArray) && !isLoading.status) && <Wrapper>
                <p className={classes.statusTxt}>Nothing to show!</p>
                <button className={classes.reloadBtn} onClick={reloadJobsHandler}>Reload</button>
            </Wrapper>}
            {isLoading.status &&<Wrapper>
                <Spinner />
                <p className={classes.statusTxt}>{isLoading.message}</p>
                {(isNull(featuredJobArray) && !isLoading.status) &&<button className={classes.reloadBtn} onClick={reloadJobsHandler}>Reload</button>}
            </Wrapper>}
           
            <ul className={classes.unorderedList}>
                {(!isNull(featuredJobArray)) && featuredJobArray.map((item, idx)=>(
                    <li key={item.postingAddress} onClick={()=>fetchJobDetailsHandler(item.postingAddress)} style={selectedPostingAddress === item.postingAddress? style : {}}>
                    <div className={classes.profileBox}>
                        <span className={classes.circle}>
                        {item.companyName.slice(0,1)}
                        </span>
                    </div>
                    <div className={classes.detailContainer}>
                        <h2 className={classes.jobTitle} style={selectedPostingAddress === item.postingAddress? style : {}}>{getJobTitle(item.jobTitle)}</h2>
                        <p className={classes.name} style={selectedPostingAddress === item.postingAddress? style : {}}>{item.companyName}</p>
                        <p className={classes.locationTxt} style={selectedPostingAddress === item.postingAddress? style : {}}>{`${item.locationType} | ${item.workType}`}</p>
                        <p className={classes.locationTxt} style={selectedPostingAddress === item.postingAddress? style : {}}>{item.postingDateFeatures === 0? '--' : <Moment fromNow>{new Date(item.postingDateFeatures * 1000)}</Moment>}</p>
                    </div>
                    <div className={classes.optionContainer}>
                        {/* <span className={classes.smallCircle} style={selectedPostingAddress === item.postingAddress? style : {}}>
                            <img src={moreIcon} alt='' style={selectedPostingAddress === item.postingAddress? style : {}} />
                        </span> */}
                    </div>
                </li>
                ))}
            </ul>
            </>}
            {dispatch.latest &&<>
            {(isNull(latestJobArray) && !isLoading.status) && <Wrapper>
                <p className={classes.statusTxt}>Nothing to show!</p>
                <button className={classes.reloadBtn} onClick={reloadJobsHandler}>Reload</button>
            </Wrapper>}
            {isLoading.status &&<Wrapper>
                <Spinner />
                <p className={classes.statusTxt}>{isLoading.message}</p>
                {(isNull(latestJobArray) && !isLoading.status) &&<button className={classes.reloadBtn} onClick={reloadJobsHandler}>Reload</button>}
            </Wrapper>}
           
            <ul className={classes.unorderedList}>
                {(!isNull(latestJobArray)) && latestJobArray.map((item, idx)=>(
                    <li key={item.postingAddress} onClick={()=>fetchJobDetailsHandler(item.postingAddress)} style={selectedPostingAddress === item.postingAddress? style : {}}>
                    <div className={classes.profileBox}>
                        <span className={classes.circle}>
                        {item.companyName.slice(0,1)}
                        </span>
                    </div>
                    <div className={classes.detailContainer}>
                        <h2 className={classes.jobTitle} style={selectedPostingAddress === item.postingAddress? style : {}}>{getJobTitle(item.jobTitle)}</h2>
                        <p className={classes.name} style={selectedPostingAddress === item.postingAddress? style : {}}>{item.companyName}</p>
                        <p className={classes.locationTxt} style={selectedPostingAddress === item.postingAddress? style : {}}>{`${item.locationType} | ${item.workType}`}</p>
                        <p className={classes.locationTxt} style={selectedPostingAddress === item.postingAddress? style : {}}>{item.postingDateFeatures === 0? '--' : <Moment fromNow>{new Date(item.postingDateFeatures * 1000)}</Moment>}</p>
                    </div>
                    <div className={classes.optionContainer}>
                        {/* <span className={classes.smallCircle} style={selectedPostingAddress === item.postingAddress? style : {}}>
                            <img src={moreIcon} alt='' style={selectedPostingAddress === item.postingAddress? style : {}} />
                        </span> */}
                    </div>
                </li>
                ))}
            </ul>
            </>}
            {dispatch.popular &&<>
            {(isNull(popularJobArray) && !isLoading.status) && <Wrapper>
                <p className={classes.statusTxt}>Nothing to show!</p>
                <button className={classes.reloadBtn} onClick={reloadJobsHandler}>Reload</button>
            </Wrapper>}
            {isLoading.status &&<Wrapper>
                <Spinner />
                <p className={classes.statusTxt}>{isLoading.message}</p>
                {(isNull(popularJobArray) && !isLoading.status) &&<button className={classes.reloadBtn} onClick={reloadJobsHandler}>Reload</button>}
            </Wrapper>}
           
            <ul className={classes.unorderedList}>
                {(!isNull(popularJobArray)) && popularJobArray.map((item, idx)=>(
                    <li key={item.postingAddress} onClick={()=>fetchJobDetailsHandler(item.postingAddress)} style={selectedPostingAddress === item.postingAddress? style : {}}>
                    <div className={classes.profileBox}>
                        <span className={classes.circle}>
                        {item.companyName.slice(0,1)}
                        </span>
                    </div>
                    <div className={classes.detailContainer}>
                        <h2 className={classes.jobTitle} style={selectedPostingAddress === item.postingAddress? style : {}}>{getJobTitle(item.jobTitle)}</h2>
                        <p className={classes.name} style={selectedPostingAddress === item.postingAddress? style : {}}>{item.companyName}</p>
                        <p className={classes.locationTxt} style={selectedPostingAddress === item.postingAddress? style : {}}>{`${item.locationType} | ${item.workType}`}</p>
                        <p className={classes.locationTxt} style={selectedPostingAddress === item.postingAddress? style : {}}>{item.postingDateFeatures === 0? '--' : <Moment fromNow>{new Date(item.postingDateFeatures * 1000)}</Moment>}</p>
                    </div>
                    <div className={classes.optionContainer}>
                        {/* <span className={classes.smallCircle} style={selectedPostingAddress === item.postingAddress? style : {}}>
                            <img src={moreIcon} alt='' style={selectedPostingAddress === item.postingAddress? style : {}} />
                        </span> */}
                    </div>
                </li>
                ))}
            </ul>
            </>}
            </main>
                <main className={classes.rightSide}>
                    {/* {header()} */}
                    {(!isNull(jobDetails)) && <header className={classes.jobTitleColored}>
                    <div className={classes.jobTitleColoredDivLeft}>
                        <h1>{jobDetails.jobTitle}</h1>
                        <div className={classes.jobTitleNameContainer}>
                            <span>{jobDetails.companyName.slice(0,1)}</span>
                            <p>{jobDetails.companyName}</p>
                        </div>
                    </div>
                    <div className={classes.jobTitleColoredDivRight}>
                        {/* {(!isApproved && !isStaked) &&<p onClick={approveHandler}>Approve 1 CMP to stake</p>} */}
                        {!isStaked &&<button val='Stake To Apply' onClick={stakeHandler} className={classes.applyNowBtn}>Stake To Apply</button>}
                        {isStaked &&<button val='Apply Now' onClick={openCompanyUrl} className={classes.applyNowBtn}>Apply Now</button>}
                    </div>
                </header>}
                    {(isNull(jobDetails) && !isLoadingJobDesc.status) && 
                    <Wrapper>
                         <p className={classes.statusTxt}>Click on a job to view</p>
                    </Wrapper>}
                    {isLoadingJobDesc.status &&<Wrapper>
                        <Spinner />
                        <p className={classes.statusTxt}>{isLoadingJobDesc.message}</p>
                        {(isNull(jobDetails) && !isLoadingJobDesc.status) &&<button className={classes.reloadBtn}>Reload</button>}
                    </Wrapper>}
                    {!isNull(jobDetails) && <section className={classes.fullDetailContainer}>
                    <main className={classes.shortDescriptionSection}>
                    <span>
                        <img src={location2} alt='' />
                        <p>{`${jobDetails.jobLocationSupport} | ${jobDetails.locationType}`}</p>
                    </span>
                    <span>
                        <img src={designIcon} alt='' />
                        <p>{jobDetails.categoryFeature.join(',')}</p>
                    </span>
                    <span>
                        <img src={briefcase} alt='' />
                        <p>{jobDetails.workType}</p>
                    </span>
                    <span>
                        <img src={skillIcon} alt='' />
                    <div className={classes.skillContainer}>
                        {jobDetails.skillsFeature.map((item, idx)=>(
                            <p key={item}>{item}</p>
                        ))}
                    </div>
                    </span>
                    </main>
                    <main className={classes.aboutJobDescriptionContainer}>
                        <h1>About</h1>
                        {/* <p>{jobDetails.companySummary}</p> */}
                        <p dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(jobDetails.companySummary)}}></p>
                        {/* <h1>Job Description</h1> */}
                        {/* <p className={classes.jobDescription}>{jobDetails.jobDesc}</p> */}
                        {(!isNull(jobDetails.jobDesc) && typeof jobDetails.jobDesc === 'string') &&<div dangerouslySetInnerHTML={{__html: DOMPurify.sanitize(jobDetails.jobDesc)}} className={classes.jobDescription}></div>}
                        {(!isNull(jobDetails.jobDesc) && typeof jobDetails.jobDesc === 'object') && jobDetails.jobDesc.map((item, idx)=>(
                            <>
                            {!isNull(item.attributes) && item.attributes.bold && <strong className={classes.jobDescription} style={{ fontWeight: 'bold'}}>{item.insert}</strong>}
                            {isNull(item.attributes) &&<div key={idx} className={classes.jobDescription}>{item.insert}</div>}
                            </>
                        ))}
                    </main>
                    {isStaked &&<div className={classes.applyNowBtnContainer}>
                        <button onClick={openCompanyUrl}>Apply Now</button>
                    </div>}
                </section>}
                </main>
        </>
    )

    const mobile = (
        <>
        {!showJobDesc && <main className={classes.leftSide}>
        {/* <h2 className={classes.jobCount}>390 Design Jobs available in London, UK</h2> */}
            <header className={classes.top}>
                <nav className={classes.nav}>
                    <button 
                        onClick={()=>selectedJobHandler('featured')} 
                        className={`${classes.jobTypeBtn} ${dispatch.featured&& classes.selected}`}>Featured Jobs</button>
                    <button 
                        onClick={()=>selectedJobHandler('latest')} 
                        className={`${classes.jobTypeBtn} ${dispatch.latest && classes.selected}`}>Latest Jobs</button>
                    <button 
                        onClick={()=>selectedJobHandler('popular')} 
                        className={`${classes.jobTypeBtn} ${dispatch.popular && classes.selected }`}>Popular Jobs</button>
                </nav>
            </header>
            {dispatch.featured &&<>
            {(isNull(featuredJobArray) && !isLoading.status) && <Wrapper>
                <p className={classes.statusTxt}>Nothing to show!</p>
                <button className={classes.reloadBtn} onClick={reloadJobsHandler}>Reload</button>
            </Wrapper>}
            {isLoading.status &&<Wrapper>
                <Spinner />
                <p className={classes.statusTxt}>{isLoading.message}</p>
                {(isNull(featuredJobArray) && !isLoading.status) &&<button className={classes.reloadBtn} onClick={reloadJobsHandler}>Reload</button>}
            </Wrapper>}
            <ul className={classes.unorderedList}>
                {(!isNull(featuredJobArray)) && featuredJobArray.map((item, idx)=>(
                   <li key={item.postingAddress} onClick={()=>fetchJobDetailsHandler(item.postingAddress)}>
                   <div className={classes.profileBox}>
                       <span className={classes.circle}>
                           
                       </span>
                   </div>
                   <div className={classes.detailContainer}>
                        <h2 className={classes.jobTitle}>{getJobTitle(item.jobTitle)}</h2>
                        <p className={classes.name}>{item.companyName}</p>
                        <p className={classes.locationTxt}>{`${item.locationType} | ${item.workType}`}</p>
                        <p className={classes.locationTxt}>{item.postingDateFeatures === 0? '--' : <Moment fromNow>{new Date(item.postingDateFeatures * 1000)}</Moment>}</p>
                    </div>
                    <div className={classes.optionContainer}>
                        {/* <span className={classes.smallCircle}>
                            <img src={moreIcon} alt='' />
                        </span> */}
                    </div>
                </li>
                ))}
            </ul>
            </>}
            {dispatch.latest &&<>
            {(isNull(latestJobArray) && !isLoading.status) && <Wrapper>
                <p className={classes.statusTxt}>Nothing to show!</p>
                <button className={classes.reloadBtn} onClick={reloadJobsHandler}>Reload</button>
            </Wrapper>}
            {isLoading.status &&<Wrapper>
                <Spinner />
                <p className={classes.statusTxt}>{isLoading.message}</p>
                {(isNull(latestJobArray) && !isLoading.status) &&<button className={classes.reloadBtn} onClick={reloadJobsHandler}>Reload</button>}
            </Wrapper>}
            <ul className={classes.unorderedList}>
                {(!isNull(latestJobArray)) && latestJobArray.map((item, idx)=>(
                   <li key={item.postingAddress} onClick={()=>fetchJobDetailsHandler(item.postingAddress)}>
                   <div className={classes.profileBox}>
                       <span className={classes.circle}>
                           
                       </span>
                   </div>
                   <div className={classes.detailContainer}>
                        <h2 className={classes.jobTitle}>{getJobTitle(item.jobTitle)}</h2>
                        <p className={classes.name}>{item.companyName}</p>
                        <p className={classes.locationTxt}>{`${item.locationType} | ${item.workType}`}</p>
                        <p className={classes.locationTxt}>{item.postingDateFeatures === 0? '--' : <Moment fromNow>{new Date(item.postingDateFeatures * 1000)}</Moment>}</p>
                    </div>
                    <div className={classes.optionContainer}>
                        <span className={classes.smallCircle}>
                            <img src={moreIcon} alt='' />
                        </span>
                    </div>
                </li>
                ))}
            </ul>
            </>}
            {dispatch.popular &&<>
            {(isNull(popularJobArray) && !isLoading.status) && <Wrapper>
                <p className={classes.statusTxt}>Nothing to show!</p>
                <button className={classes.reloadBtn} onClick={reloadJobsHandler}>Reload</button>
            </Wrapper>}
            {isLoading.status &&<Wrapper>
                <Spinner />
                <p className={classes.statusTxt}>{isLoading.message}</p>
                {(isNull(popularJobArray) && !isLoading.status) &&<button className={classes.reloadBtn} onClick={reloadJobsHandler}>Reload</button>}
            </Wrapper>}
            <ul className={classes.unorderedList}>
                {(!isNull(popularJobArray)) && popularJobArray.map((item, idx)=>(
                   <li key={item.postingAddress} onClick={()=>fetchJobDetailsHandler(item.postingAddress)}>
                   <div className={classes.profileBox}>
                       <span className={classes.circle}>
                           
                       </span>
                   </div>
                   <div className={classes.detailContainer}>
                        <h2 className={classes.jobTitle}>{getJobTitle(item.jobTitle)}</h2>
                        <p className={classes.name}>{item.companyName}</p>
                        <p className={classes.locationTxt}>{`${item.locationType} | ${item.workType}`}</p>
                        <p className={classes.locationTxt}>{item.postingDateFeatures === 0? '--' : <Moment fromNow>{new Date(item.postingDateFeatures * 1000)}</Moment>}</p>
                    </div>
                    <div className={classes.optionContainer}>
                        <span className={classes.smallCircle}>
                            <img src={moreIcon} alt='' />
                        </span>
                    </div>
                </li>
                ))}
            </ul>
            </>}
            </main>}
                {showJobDesc && <main className={classes.rightSide}>
                    {/* {headerMobile()} */}
                    {(!isNull(jobDetails)) &&<header className={classes.jobTitleColored}>
                    <div className={classes.backwardIconContainer}>
                        <img src={backIcon} alt='' className={classes.backIcon} onClick={()=>setShowJobDesc(false)} />
                    </div>
                        <div className={classes.jobTitleColoredDivLeft}>
                            <h1>{jobDetails.jobTitle}</h1>
                            <div className={classes.jobTitleNameContainer}>
                                <span>{jobDetails.companyName.slice(0,1)}</span>
                                <p>{jobDetails.companyName}</p>
                            </div>
                        </div>
                        <div className={classes.jobTitleColoredDivRight}>
                        {/* {(!isApproved && !isStaked) &&<p onClick={approveHandler}>Approve 1 CMP to stake</p>} */}
                        {!isStaked &&<button val='Stake To Apply' onClick={stakeHandler} className={classes.applyNowBtn}>Stake To Apply</button>}
                        {isStaked &&<button val='Apply Now' onClick={openCompanyUrl} className={classes.applyNowBtn}>Apply Now</button>}
                        </div>
                    </header>}
                    {(isNull(jobDetails) && !isLoadingJobDesc.status) && <Wrapper>
                         <p className={classes.statusTxt}>Click on a job to view</p>
                    </Wrapper>}
                    {isLoadingJobDesc.status &&<Wrapper>
                        <Spinner />
                        <p className={classes.statusTxt}>{isLoadingJobDesc.message}</p>
                        {(isNull(jobDetails) && !isLoadingJobDesc.status) &&<button className={classes.reloadBtn}>Reload</button>}
                    </Wrapper>}
                    {!isNull(jobDetails) && <section className={classes.fullDetailContainer}>
                    <main className={classes.shortDescriptionSection}>
                    <span>
                        <img src={location2} alt='' />
                        <p>{`${jobDetails.jobLocationSupport} | ${jobDetails.locationType}`}</p>
                    </span>
                    <span>
                        <img src={designIcon} alt='' />
                        <p>{jobDetails.categoryFeature.join(',')}</p>
                    </span>
                    <span>
                        <img src={briefcase} alt='' />
                        <p>{jobDetails.workType}</p>
                    </span>
                    <span>
                        <img src={skillIcon} alt='' />
                    <div className={classes.skillContainer}>
                        {jobDetails.skillsFeature.map((item, idx)=>(
                            <p key={item}>{item}</p>
                        ))}
                    </div>
                    </span>
                    </main>
                    <main className={classes.aboutJobDescriptionContainer}>
                        {/* <h1>About</h1>
                        <p>{jobDetails.companySummary}</p>
                        <h1>Job Description</h1>
                        <p className={classes.jobDescription}>{jobDetails.jobDesc}</p> */}
                        <h1>About</h1>
                         <p dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(jobDetails.companySummary)}}></p>

                        {(!isNull(jobDetails.jobDesc) && typeof jobDetails.jobDesc === 'string') && <p dangerouslySetInnerHTML={{__html: DOMPurify.sanitize(jobDetails.jobDesc)}} className={classes.jobDescription}></p>}
                        {(!isNull(jobDetails.jobDesc) && typeof jobDetails.jobDesc === 'object') && jobDetails.jobDesc.map((item, idx)=>(
                        <>
                        {!isNull(item.attributes) && item.attributes.bold && <strong className={classes.jobDescription} style={{ fontWeight: 'bold'}}>{item.insert}</strong>}
                        {isNull(item.attributes) &&<div key={idx} className={classes.jobDescription}>{item.insert}</div>}
                        </>
                    ))}
                    </main>
                    {isStaked &&<div className={classes.applyNowBtnContainer}>
                        <button onClick={openCompanyUrl}>Apply Now</button>
                    </div>}
                    </section>}
                    {/* </div> */}
                    
                </main>}
        </>
    )
    return(
        <main className={classes.parent} id='previous_application'>
            {openStakePopup && <StakePopup setOpenStakePopup={setOpenStakePopup} />}
            {/* {apply && <ApplyForJobPopup ref={dialogRef} setApply={setApply} selectedPostingAddress={selectedPostingAddress} />} */}
            <dialog ref={dialogRef} style={{ display: apply? 'flex' : 'none'}}>
                  {apply && <ApplyForJobPopup ref={dialogRef} setApply={setApply} selectedPostingAddress={selectedPostingAddress} />}
            </dialog>
            {showReceipt.isVisible && <ReceiptPopup hash={showReceipt.hash} type={showReceipt.type} setShowReceipt={setShowReceipt} ref={dialogRef} />}
            <header className={classes.header}>
                <h1>Browse Jobs</h1>
                <button onClick={()=>navigate('/jobseeker_dashboard')}>Previous Applications</button>
            </header>
             <div className={classes.box}>
                <div className={classes.inputContainer}>
                     <input type='search' ref={searchRef} placeholder='UI/UX Designer' className={classes.input} />
                     {/* <span className={classes.searchContainer}>
                        <img src={searchIcon} alt='' />
                     </span> */}
                </div>
               {width > 770 && <button className={classes.searchBtn} type='submit' onClick={handleSearch}>Search Jobs</button>}
               {/* {width <= 770 &&<span className={classes.searchSpan}>
                    <img src={searchIcon} alt='' />
                </span>} */}
             </div>
             <div className={classes.allJobsParent}>
                <section className={classes.allJobsBlack}>
                   {width > 770 && desktop}
                   {width <= 770 && mobile}
                </section>
             </div>
             {/* <header>Sustainability Week Event</header> */}
        </main>
    )
}

export default BrowseJobs;