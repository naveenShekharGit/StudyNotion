const Profile = require('../models/Profile');
const User = require('../models/User');
const {uploadFileToCloudinary} = require('../utils/fileUploader');
// controller for updating profile details
exports.updateProfile = async (req,res)=>
{
    try
    {
        // fetch id
        const userId = req.user.id;

        // fetch data
        const {dateOfBirth = "",about="",contactNumber,gender} = req.body;

        // find profile by id
        const userDetails = await User.findById(userId);
        const profileDeatils = await Profile.findById(userDetails.additionalDetails);

        // update profile fields
        profileDeatils.dateOfBirth = dateOfBirth;
        profileDeatils.about = about;
        profileDeatils.contactNumber = contactNumber;
        profileDeatils.gender = gender;

        // Save the updated profile
        await profileDeatils.save();

            // return response
        return res.json({
          success: true,
          message: "Profile updated successfully",
          profileDeatils
        });
    }
    catch(error)
    {
        return res.status(500).json({
			success: false,
			error: error.message,
		});
    }
}

// controller for deleting account
exports.deleteAccount = async (req,res)=>
{
    try
    {
    const id = req.user.id;
		const user = await User.findById({ _id: id });
		if (!user) {
			return res.status(404).json({
				success: false,
				message: "User not found",
			});
		}
		// Delete Assosiated Profile with the User
		await Profile.findByIdAndDelete({ _id: user.additionalDetails });
		// TODO: Unenroll User From All the Enrolled Courses
		// Now Delete User
		await User.findByIdAndDelete({ _id: id });
		res.status(200).json({
			success: true,
			message: "User deleted successfully",
		});
    }
    catch(error)
    {
        res
			.status(500)
			.json({ success: false, message: "User Cannot be deleted successfully" });
	
    }
}

exports.getAllUserDetails = async (req, res) => {
	try {
		const id = req.user.id;
		const userDetails = await User.findById(id)
			.populate("additionalDetails")
			.exec();
		console.log(userDetails);
		res.status(200).json({
			success: true,
			message: "User Data fetched successfully",
			data: userDetails,
		});
	} catch (error) {
		return res.status(500).json({
			success: false,
			message: error.message,
		});
	}
};

exports.updateDisplayPicture = async (req, res) => {
    try {
      const displayPicture = req.files.displayPicture
      const userId = req.user.id
      const image = await uploadFileToCloudinary(
        displayPicture,
        process.env.FOLDER_NAME,
        1000,
        1000
      )
      console.log(image)
      const updatedProfile = await User.findByIdAndUpdate(
        { _id: userId },
        { image: image.secure_url },
        { new: true }
      )
      res.send({
        success: true,
        message: `Image Updated successfully`,
        data: updatedProfile
      })
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message,
      })
    }
};
  
exports.getEnrolledCourses = async (req, res) => {
    try {
      const userId = req.user.id
      const userDetails = await User.findOne({
        _id: userId,
      })
        .populate("courses")
        .exec()
      if (!userDetails) {
        return res.status(400).json({
          success: false,
          message: `Could not find user with id: ${userDetails}`,
        })
      }
      return res.status(200).json({
        success: true,
        data: userDetails.courses,
      })
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message,
      })
    }
};