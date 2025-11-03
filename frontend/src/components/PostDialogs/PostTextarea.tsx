// import { forwardRef, memo } from "react";

// interface PostTextareaProps {
//   defaultValue?: string;
//   disabled?: boolean;
// }

// const PostTextarea = memo(
//   forwardRef<HTMLTextAreaElement, PostTextareaProps>(({ defaultValue, disabled }, ref) => {
//     // console.log("Textarea rendered");
//     return (
//       <textarea
//         ref={ref}
//         defaultValue={defaultValue}
//         placeholder="What do you want to talk about?"
//         className="w-full text-lg p-2 rounded resize-none min-h-[100px] focus:outline-none"
//         disabled={disabled}
//       />
//     );
//   })
// );

// export default PostTextarea;


import { forwardRef, memo } from "react";
import React from "react";

interface PostTextareaProps {
  defaultValue?: string;
  disabled?: boolean;
  onChange?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
}

const PostTextarea = memo(
  forwardRef<HTMLTextAreaElement, PostTextareaProps>(
    ({ defaultValue, disabled, onChange }, ref) => {
      return (
        <textarea
          ref={ref}
          defaultValue={defaultValue}
          placeholder="What do you want to talk about?"
          className="w-full text-lg p-2 rounded resize-none min-h-[100px] focus:outline-none"
          disabled={disabled}
          onChange={onChange}
        />
      );
    }
  )
);

export default PostTextarea;
