import { useContext, useLayoutEffect, useState } from 'react';



import classes from '../styles/popups/PostJobPopup.module.css';
import LocationTypeList from '../lists/LocationTypeList';
import LocationSupportList from '../lists/LocationSupportList';
import WorkTypeList from '../lists/WorkTypeList';
import PaymentTypeList from '../lists/PaymentTypeList';
import backIcon from '../assets/back.png'
import dropdownIcon from '../assets/dropdown.png';
import { isNull } from '../utils/Util';
import { getHashFromIpfs } from '../contracts/IPFS';
import { editDraftJobInformation, saveToEVM } from '../contracts/ContractManager';
import { getProvider } from '../contracts/init';
import { ethers } from 'ethers';
import { FormContext } from '../App';


const CreateJobForm = (props) =>{
    const { setDispatch } = props;
    const [ paymentStatus, setPaymentStatus ] = useState({status: 'none', text: '', color: 'transparent', show: false});
    const { jobTitle, setJobTitle, locationType, setLocationType,locationSupport, setLocationSupport, workLocation, setWorkLocation, companyName, setCompanyName, companyLink, setCompanyLink, companySummary, setCompanySummary, skills, setSkills, searchCategories, setSearchCategories, searchTerms, setSearchTerms, workType, setWorkType, paymentType, setPaymentType, jobDesc, setJobDesc, jobApplyLink, setJobApplyLink, employerPostingAddress } = useContext(FormContext);
    


    useLayoutEffect(()=>{
        reset();
        (async()=>{
            console.log(employerPostingAddress)

            const data = await editDraftJobInformation(employerPostingAddress);
            console.log('EDIT : ', data.jobDesc);

            setJobTitle({ text: data.jobTitle, isValid: isNull(data.jobTitle)? false : true });
            setLocationType({ text: data.locationType, isValid: isNull(data.locationType)? false : true });
            setLocationSupport({ text: data.locationSupport, isValid: isNull(data.locationSupport)? false : true });
            setWorkLocation({ text: data.workLocation, isValid: isNull(data.workLocation)? false : true });
            setCompanyName({ text: data.companyName, isValid: isNull(data.companyName)? false : true });
            setCompanyLink({ text: data.companyLink, isValid: isNull(data.companyLink)? false : true });
            setCompanySummary({ text: data.companySummary, isValid: isNull(data.companySummary)? false : true });
            try{
            setSkills({ text: data.skills.join(','), isValid: isNull(data.skills)? false : true });
            setSearchCategories({ text: data.searchCategory.join(','), isValid: isNull(data.searchCategory)? false : true });
            }catch(err){}
            setSearchTerms({ text: data.searchTerms, isValid: isNull(data.searchTerms)? false : true });
            setWorkType({ text: data.workType, isValid: isNull(data.workType)? false : true });
            setPaymentType({ text: data.paymentType, isValid: isNull(data.paymentType)? false : true });
            setJobDesc({ text: data.jobDesc, isValid: isNull(data.jobDesc)? false : true });
            setJobApplyLink({ text: data.applyLink, isValid: isNull(data.applyLink)? false : true });

            console.log('EDIT : ', data)
        })();
    },[]);


    const updateJobTitleHandler = (e) =>{
        const value = e.target.value;
        if(isNull(value))setJobTitle({ isValid: false, text: value });
        else setJobTitle({ isValid: true, text: value });
    }

    const updateWorkLocationHandler = (e) =>{
        const value = e.target.value;
        if(isNull(value))setWorkLocation({ isValid: false, text: value });
        else setWorkLocation({ isValid: true, text: value });
    }

    const updateCompanyNameHandler = (e) =>{
        const value = e.target.value;
        if(isNull(value))setCompanyName({ isValid: false, text: value });
        else setCompanyName({ isValid: true, text: value });
    }

    const updateCompanyLinkHandler = (e) =>{
        const value = e.target.value;
        if(isNull(value))setCompanyLink({ isValid: false, text: value });
        else setCompanyLink({ isValid: true, text: value });
    }

    // const updateCompanyLogoHandler = (e) =>{
    //     const value = e.target.value;
    //     if(isNull(value))setCompanyLogo({ isValid: false, text: value });
    //     else setCompanyLogo({ isValid: true, text: value });
    // }

    const updateCompanySummaryHandler = (e) =>{
        const value = e.target.value;
        if(isNull(value))setCompanySummary({ isValid: false, text: value });
        else setCompanySummary({ isValid: true, text: value });
    }

    const updateSkillsHandler = (e) =>{
        const value = e.target.value;
        if(isNull(value))setSkills({ isValid: false, text: value });
        else setSkills({ isValid: true, text: value });
    }

    const updateSearchCategoriesHandler = (e) =>{
        const value = e.target.value;
        if(isNull(value))setSearchCategories({ isValid: false, text: value });
        else setSearchCategories({ isValid: true, text: value });
    }

    const updateSearchTermsHandler = (e) =>{
        const value = e.target.value;
        if(isNull(value))setSearchTerms({ isValid: false, text: value });
        else setSearchTerms({ isValid: true, text: value });
    }

    const updateJobDescHandler = (e) =>{
        const value = e.target.value;
        console.log(value)
        if(isNull(value))setJobDesc({ isValid: false, text: value });
        else setJobDesc({ isValid: true, text: value });
    }

    const updateJobApplyLinkHandler = (e) =>{
        const value = e.target.value;
        if(isNull(value))setJobApplyLink({ isValid: false, text: value });
        else setJobApplyLink({ isValid: true, text: value });
    }


    // const saveJobPostingHandler = () =>{
    //     // setPaymentStatus({ status: 'none', text: '', color: '', show: false});
    //     // setDispatch({ TYPE: 'MAKE_PAYMENT' });
    //     create();
    // }


    const saveJobPostingHandler = async() =>{
        // console.log('HASHES: ', result)
        // const hash = '0x94a31374d85bb028582c7a1876bd03e5d1560f0594043226baa563b4c3cd9f59';
        // const txn = await getProvider().getTransaction(hash);
        // console.log(ethers.utils.formatUnits(txn.gasPrice, 6));
        // return;
        if(jobTitle.isValid && locationType.isValid && locationSupport.isValid && companyName.isValid && companyLink.isValid && companySummary.isValid && skills.isValid && searchCategories.isValid && searchTerms.isValid && workType.isValid && paymentType.isValid && jobDesc.isValid && jobApplyLink.isValid){
          console.log('all data entered')
            try{
            const jobDescriptionHash = await getHashFromIpfs(jobDesc.text);
            const companySummaryHash = await getHashFromIpfs(companySummary.text);
            // console.log('Job Desc hash: ', jobDescriptionHash);
            // console.log('Company hash: ', companySummaryHash);

            const JOB_JSON = JSON.stringify({
                jobTitle: jobTitle.text,
                locationType: locationType.text,
                locationSupport: locationSupport.text,
                workLocation: workLocation.text,
                companyName: companyName.text,
                companyLink: companyLink.text,
                companySummary: companySummary.text,
                workType: workType.text,
                paymentType: paymentType.text,
                description: {ops: [{ insert: jobDesc.text} ]},
                userSearchTerms: searchTerms.text,
                applicationLink: jobApplyLink.text,
                skillsRequired: skills.text.split(','),
                searchCategories: searchCategories.text.split(',')
            });

            saveToEVM(JOB_JSON, jobDescriptionHash, companySummaryHash, employerPostingAddress);
        }catch(err){
            console.log('something happened', err)
        }
        }
    }


    const reset = ()=>{
        setJobTitle({ isValid: false, text: '' });
        setLocationType({ isValid: false, text: '' });
        setLocationSupport({ isValid: false, text: '' });
        setWorkLocation({ isValid: false, text: '' });
        setCompanyName({ isValid: false, text: '' });
        setCompanyLink({ isValid: false, text: '' });
        // setCompanyLogo({ isValid: false, text: '' });
        setCompanySummary({ isValid: false, text: '' });
        setSkills({ isValid: false, text: '' });
        setSearchCategories({ isValid: false, text: '' });
        setSearchTerms({ isValid: false, text: '' });
        setWorkType({ isValid: false, text: '' });
        setPaymentType({ isValid: false, text: '' });
        setJobDesc({ isValid: false, text: '' });
        setJobApplyLink({ isValid: false, text: '' });
    }


    return(
        <main className={classes.box2} onClick={(e)=>e.stopPropagation()}>
           <section className={classes.backSection}>
            <img src={backIcon} alt=''  onClick={()=>setDispatch({ TYPE: 'EDIT_DRAFT' })} />
        </section>
        <section className={classes.contentSection}>
            <h1 className={classes.fillFormTxt}>Edit Job Posting Details</h1>
            <div className={classes.inputContainer}>
                <p className={classes.label}>Job Title*</p>
                <input 
                    type='' 
                    placeholder='Enter Job Title' 
                    className={classes.input2} 
                    value={jobTitle.text}
                    onChange={updateJobTitleHandler}
                />
            </div>
            <div className={classes.inputContainer}>
                <p className={classes.label}>Location Type*</p>
                <input 
                    type='' 
                    placeholder='Geo Remote' 
                    readOnly 
                    value={locationType.text} 
                    onFocus={()=>setLocationType(prev=>({...prev, isVisible: true}))} 
                    onBlur={()=>setTimeout(()=> setLocationType(prev=>({...prev, isVisible: false})), 300)}
                    className={classes.input2}
                />
                <span className={classes.dropDownContainer}>
                    <img src={dropdownIcon} alt='' />
                </span>
                {locationType.isVisible && <LocationTypeList setLocationType={setLocationType} />}
            </div>
            <div className={classes.inputContainer}>
                <p className={classes.label}>Location Support*</p>
                <input 
                   type='' 
                   placeholder='Supported Location' 
                   readOnly 
                   className={classes.input2} 
                   value={locationSupport.text} 
                   onFocus={()=>setLocationSupport(prev=>({...prev, isVisible: true}))} 
                   onBlur={()=>setTimeout(()=> setLocationSupport(prev=>({...prev, isVisible: false})), 300)}
                />
                <span className={classes.dropDownContainer}>
                    <img src={dropdownIcon} alt='' />
                </span>
                {locationSupport.isVisible && <LocationSupportList setLocationSupport={setLocationSupport} />}
            </div>
            <div className={classes.inputContainer}>
                <p className={classes.label}>Work Location</p>
                <input 
                    type='' 
                    placeholder='Enter Work Location (Optional)' 
                    className={classes.input2} 
                    value={workLocation.text}
                    onChange={updateWorkLocationHandler}
                />
            </div>
            <div className={classes.inputContainer}>
                <p className={classes.label}>Company Name*</p>
                <input 
                    type='' 
                    placeholder='Enter Company Name' 
                    className={classes.input2} 
                    value={companyName.text}
                    onChange={updateCompanyNameHandler}
                />
            </div>
            <div className={classes.inputContainer}>
                <p className={classes.label}>Company Link*</p>
                <input 
                    type='' 
                    placeholder='Enter Company Link' 
                    className={classes.input2} 
                    value={companyLink.text}
                    onChange={updateCompanyLinkHandler}
                />
            </div>
            {/* <div className={classes.inputContainer}>
                <p className={classes.label}>Company Logo*</p>
                <span className={classes.logoContainer}>
                    <button className={classes.logoBtn}>Upload Logo</button>
                </span>
            </div> */}
            <div className={classes.inputContainer}>
                <p className={classes.label}>Summary about your company*</p>
                <textarea 
                    placeholder='Enter Summary' 
                    className={classes.textarea} 
                    value={companySummary.text}
                    onChange={updateCompanySummaryHandler}
                />
            </div>
            <div className={classes.inputContainer}>
                <p className={classes.label}>Skills Required*</p>
                <textarea 
                    placeholder='Enter skills required' 
                    className={classes.textarea} 
                    value={skills.text}
                    onChange={updateSkillsHandler}
                />
            </div>
            <div className={classes.inputContainer}>
                <p className={classes.label}>Search categories*</p>
                <textarea 
                    placeholder='Enter search categories' 
                    className={classes.textarea} 
                    value={searchCategories.text}
                    onChange={updateSearchCategoriesHandler}    
                />
            </div>
            <div className={classes.inputContainer}>
                <p className={classes.label}>Search terms*</p>
                <textarea 
                    placeholder='Enter search terms' 
                    className={classes.textarea} 
                    value={searchTerms.text}
                    onChange={updateSearchTermsHandler}
                />
            </div>
            <div className={classes.inputContainer}>
                <p className={classes.label}>Work Type*</p>
                <input 
                    type='' 
                    placeholder='Full-Time' 
                    readOnly 
                    className={classes.input2} 
                    value={workType.text} 
                    onFocus={()=>setWorkType(prev=>({...prev, isVisible: true}))} 
                    onBlur={()=>setTimeout(()=> setWorkType(prev=>({...prev, isVisible: false})), 300)}
                />
                <span className={classes.dropDownContainer}>
                    <img src={dropdownIcon} alt='' />
                </span>
                {workType.isVisible && <WorkTypeList setWorkType={setWorkType} />}
            </div>
            <div className={classes.inputContainer}>
                <p className={classes.label}>Payment Type*</p>
                <input 
                    type='' 
                    placeholder='Fiat' 
                    readOnly 
                    className={classes.input2} 
                    value={paymentType.text} 
                    onFocus={()=>setPaymentType(prev=>({...prev, isVisible: true}))} 
                    onBlur={()=>setTimeout(()=> setPaymentType(prev=>({...prev, isVisible: false})), 300)}
                />
                <span className={classes.dropDownContainer}>
                    <img src={dropdownIcon} alt='' />
                </span>
                {paymentType.isVisible && <PaymentTypeList setPaymentType={setPaymentType} />}
            </div>
            <div className={classes.inputContainer}>
                <p className={classes.label}>Job Description*</p>
                {/* <TextEditor /> */}
                <textarea 
                    placeholder='Enter job description' 
                    className={classes.textarea} 
                    value={jobDesc.text}
                    onChange={updateJobDescHandler}    
                />
            </div>
            <div className={classes.inputContainer}>
                <p className={classes.label}>Job Application Link*</p>
                <input 
                    type='' 
                    placeholder='Link or email' 
                    className={classes.input2} 
                    value={jobApplyLink.text}
                    onChange={updateJobApplyLinkHandler}
                />
            </div>
            <div className={classes.btnContainer}>
            <button className={classes.normalBtn} onClick={reset}>Reset</button>
            <button className={classes.linearGradBtn} onClick={saveJobPostingHandler}>Save your Job Posting</button>
            <p>Warning: This action incurs gas fee</p>
        </div>
        </section>
        </main>
    )
}

export default CreateJobForm;