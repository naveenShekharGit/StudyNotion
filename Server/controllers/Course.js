const Course = require('../models/Course');
const Category = require('../models/Category');
const User = require('../models/User');
const {uploadFileToCloudinary} = require ('../utils/fileUploader');
require('dotenv').config();
const Section = require("../models/Section")
const SubSection = require("../models/SubSection")
const CourseProgress = require("../models/CourseProgress")
const { convertSecondsToDuration } = require("../utils/secToDuration")


// creating a course
exports.createCourse = async (req,res)=>
{
    try
    {
        // get user ID
        const userId = req.user.id;

        // fetch data
        let {
            courseName,
			courseDescription,
			whatYouWillLearn,
			price,
			tag,
			category,
			status,
			instructions
        } = req.body;

        // get image thumbnail
        const thumbnail = req.files.thumbnailImage;

        // check validation on fetched data
        if (
			!courseName ||
			!courseDescription ||
			!whatYouWillLearn ||
			!price ||
			!tag ||
			!thumbnail ||
			!category
		) {
			return res.status(400).json({
				success: false,
				message: "All Fields are Mandatory",
			});
		}

        if(!status || status === undefined)
        {
            status = "Draft";
        }

        // Check if user is a instructor or not
        const instructorDetails = await User.findById(userId,
            {accountType:"Instructor"});

        if(!instructorDetails)
        {
            return res.status(404).json({
				success: false,
				message: "Instructor Details Not Found",
			})
        }

        //check if category is valid 
        const categoryDetails = await Category.findById(category);
        if(!categoryDetails)
        {
            return res.status(404).json({
				success: false,
				message: "Category Details Not Found",
			})
        }

        // upload thumbnail to cloudinary
        const thumbnailImage = await uploadFileToCloudinary(thumbnail,process.env.FOLDER_NAME);

        // create new course
        const newCourse = await Course.create(
            {
                courseName,
                courseDescription,
                instructor:instructorDetails._id,
                whatYouWillLearn,
                price,
                category:categoryDetails._id,
                thumbnail:thumbnailImage.secure_url,
                status:status,
                instructions:instructions
            });

        // add new course to schema of user of account type instructor
        await User.findByIdAndUpdate(
            {
                _id:instructorDetails._id
            },
            {
                $push:{courses:newCourse._id}
            },
            {new : true});

        // add new course to schema of category
        await Category.findByIdAndUpdate(
            {_id:category},
            {$push:{courses:newCourse._id}},
            {new:true}
        );

        // return response
        res.status(200).json({
			success: true,
			data: newCourse,
			message: "Course Created Successfully",
		});
    }
    catch(error)
    {
        res.status(500).json({
			success: false,
			message: "Failed to create course",
			error: error.message,
		});
    }
}

// get all courses controller
exports.getAllCourses = async (req,res)=>
{
    try
    {
        const allCourses = await Course.find({},
            {   
                courseName:true,
                price: true,
				thumbnail: true,
				instructor: true,
				ratingAndReviews: true,
				studentsEnroled: true
            })
            .populate("instructor")
            .exec();

            return res.status(200).json({
                success: true,
                data: allCourses,
            });
    }
    catch(error)
    {
        return res.status(404).json({
			success: false,
			message: `Can't Fetch Course Data`,
			error: error.message,
		});
    }
}


// get all course details controller
exports.getCourseDetails = async (req,res)=>
{
    try
    {
        // get id 
        const {courseId} = req.body;

        // find course Details
        const courseDetails = await Course.find(
            {_id:courseId})
            .populate(
                {
                    path:"instructor",
                    populate:
                    {
                        path:"additionalDetails"
                    }                    
            })
            .populate("category")
            // .populate("ratingAndreviews")
            .populate(
                {
                    path:"courseContent",
                    populate:
                    {
                        path:"subSection"
                    }
                })
                .exec();
        
                // console.log("Course Details in BE : ",courseDetails);

        // validation
        if(!courseDetails)
        {
            return res.status(400).json({
                success:false,
                message:`Could not find the course with ${courseId}`,
            });
        }

        //return response
        return res.status(200).json({
            success:true,
            message:"Course Details fetched successfully",
            data:courseDetails,
        })
    }
    catch(error)
    {
        return res.status(500).json({
            success:false,
            message:error.message,
        });
    }
}

// Edit Course Details
exports.editCourse = async (req, res) => {
    try {
      const { courseId } = req.body
      const updates = req.body
      const course = await Course.findById(courseId)
  
      if (!course) {
        return res.status(404).json({ error: "Course not found" })
      }
  
      // If Thumbnail Image is found, update it
      if (req.files) {
        console.log("thumbnail update")
        const thumbnail = req.files.thumbnailImage
        const thumbnailImage = await uploadFileToCloudinary(
          thumbnail,
          process.env.FOLDER_NAME
        )
        course.thumbnail = thumbnailImage.secure_url
      }
  
      // Update only the fields that are present in the request body
      for (const key in updates) {
        if (updates.hasOwnProperty(key)) {
          if (key === "tag" || key === "instructions") {
            course[key] = JSON.parse(updates[key])
          } else {
            course[key] = updates[key]
          }
        }
      }
  
      await course.save()
  
      const updatedCourse = await Course.findOne({
        _id: courseId,
      })
        .populate({
          path: "instructor",
          populate: {
            path: "additionalDetails",
          },
        })
        .populate("category")
        .populate("ratingAndReviews")
        .populate({
          path: "courseContent",
          populate: {
            path: "subSection",
          },
        })
        .exec()
  
      res.json({
        success: true,
        message: "Course updated successfully",
        data: updatedCourse,
      })
    } catch (error) {
      console.error(error)
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error.message,
      })
    }
}



exports.getFullCourseDetails = async (req, res) => {
    try {
      const { courseId } = req.body
      const userId = req.user.id
      const courseDetails = await Course.findOne({
        _id: courseId,
      })
        .populate({
          path: "instructor",
          populate: {
            path: "additionalDetails",
          },
        })
        .populate("category")
        .populate("ratingAndReviews")
        .populate({
          path: "courseContent",
          populate: {
            path: "subSection",
          },
        })
        .exec()
  
      let courseProgressCount = await CourseProgress.findOne({
        courseID: courseId,
        userId: userId,
      })
  
      console.log("courseProgressCount : ", courseProgressCount)
  
      if (!courseDetails) {
        return res.status(400).json({
          success: false,
          message: `Could not find course with id: ${courseId}`,
        })
      }
  
      // if (courseDetails.status === "Draft") {
      //   return res.status(403).json({
      //     success: false,
      //     message: `Accessing a draft course is forbidden`,
      //   });
      // }
  
      let totalDurationInSeconds = 0
      courseDetails.courseContent.forEach((content) => {
        content.subSection.forEach((subSection) => {
          const timeDurationInSeconds = parseInt(subSection.timeDuration)
          totalDurationInSeconds += timeDurationInSeconds
        })
      })
  
      const totalDuration = convertSecondsToDuration(totalDurationInSeconds)
  
      return res.status(200).json({
        success: true,
        data: {
          courseDetails,
          totalDuration,
          completedVideos: courseProgressCount?.completedVideos
            ? courseProgressCount?.completedVideos
            : [],
        },
      })
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message,
      })
    }
  }
  
// Get a list of Course for a given Instructor
exports.getInstructorCourses = async (req, res) => {
    try {
      // Get the instructor ID from the authenticated user or request body
      const instructorId = req.user.id
  
      // Find all courses belonging to the instructor
      const instructorCourses = await Course.find({
        instructor: instructorId,
      }).sort({ createdAt: -1 })
  
      console.log("ALL INSTRUCTOR COURSES DATA IN BE",instructorCourses)
      // Return the instructor's courses
      res.status(200).json({
        success: true,
        data: instructorCourses,
      })
    } catch (error) {
      console.error(error)
      res.status(500).json({
        success: false,
        message: "Failed to retrieve instructor courses",
        error: error.message,
      })
    }
}

// Delete the Course
exports.deleteCourse = async (req, res) => {
    try {
      const { courseId } = req.body
  
      // Find the course
      const course = await Course.findById(courseId)
      if (!course) {
        return res.status(404).json({ message: "Course not found" })
      }
  
      // Unenroll students from the course
      const studentsEnrolled = course.studentsEnrolled
      for (const studentId of studentsEnrolled) {
        await User.findByIdAndUpdate(studentId, {
          $pull: { courses: courseId },
        })
      }
  
      // Delete sections and sub-sections
      const courseSections = course.courseContent
      for (const sectionId of courseSections) {
        // Delete sub-sections of the section
        const section = await Section.findById(sectionId)
        if (section) {
          const subSections = section.subSection
          for (const subSectionId of subSections) {
            await SubSection.findByIdAndDelete(subSectionId)
          }
        }
  
        // Delete the section
        await Section.findByIdAndDelete(sectionId)
      }
  
      // Delete the course
      await Course.findByIdAndDelete(courseId)
  
      return res.status(200).json({
        success: true,
        message: "Course deleted successfully",
      })
    } catch (error) {
      console.error(error)
      return res.status(500).json({
        success: false,
        message: "Server error",
        error: error.message,
      })
    }
}