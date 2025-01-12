import React from 'react'
import { buyCourse } from '../services/operations/studentFeaturesAPI';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';

const CourseDetails = () => {


    const {user} = useSelector((state)=>state.profile);
    const {token} = useSelector((state)=>state.auth);
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const {courseId} = useParams();


    const handleBuyCourse = ()=>
    {
        console.log("INSIDE BUY HANDLE COURSE")
        if(token)
        {
            buyCourse(token,[courseId],user,navigate,dispatch);
            return;
        }
    }



  return (
    <div className='flex items-center p-6 mt-10'>
        <button className='bg-yellow-50 p-6'
        onClick={()=>handleBuyCourse()}
        >
            Buy Now
        </button>
    </div>
  )
}

export default CourseDetails;