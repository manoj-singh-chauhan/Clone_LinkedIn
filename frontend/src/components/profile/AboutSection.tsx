// import React from "react";
// import { useProfileData } from "../../context/ProfileContext";


// const AboutSection: React.FC = () => {
//   const { profile } = useProfileData();

//   const hasAboutData = profile.about && profile.about.trim() !== "";

//   return (
//     <div className="bg-white rounded-lg shadow-md overflow-hidden">
//       <div className="p-6">
//         <div className="flex justify-between items-center mb-4">
//           <h2 className="text-xl font-semibold text-gray-900">About</h2>
          
//         </div>

//         {hasAboutData ? (
//           <p className="text-gray-700 whitespace-pre-wrap">{profile.about}</p>
//         ) : (
//           <p className="text-gray-500">yha pe about</p>
//         )}
//       </div>
//     </div>
//   );
// };

// export default AboutSection;



import React from "react";
import { useProfileData } from "../../context/ProfileContext";

const AboutSection: React.FC = () => {
  // 1. Get the full data from context
  const profileData = useProfileData();
  // 2. Destructure the nested 'profile' object
  const { profile } = profileData;

  const hasAboutData = profile.about && profile.about.trim() !== "";

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900">About</h2>
        </div>

        {hasAboutData ? (
          <p className="text-gray-700 whitespace-pre-wrap">{profile.about}</p>
        ) : (
          <p className="text-gray-500">
            You haven't added an 'about' section yet.
          </p>
        )}
      </div>
    </div>
  );
};

export default AboutSection;