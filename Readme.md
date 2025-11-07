git add .
git commit -m "first commit"
git push


mysql -u root -p
Use linkedin_clone;
SHOW INDEXES FROM users;
ALTER TABLE users
DROP INDEX email,
DROP INDEX users_email,
DROP INDEX email_2,
DROP INDEX email_3,
DROP INDEX email_4,
DROP INDEX email_5,
DROP INDEX email_6,
DROP INDEX email_7,
DROP INDEX email_8,
DROP INDEX email_9,
DROP INDEX email_10,
DROP INDEX email_11,
DROP INDEX email_12,
DROP INDEX email_13,
DROP INDEX email_14,
DROP INDEX email_15,
DROP INDEX email_16,
DROP INDEX email_17,
DROP INDEX email_18,
DROP INDEX email_19,
DROP INDEX email_20,
DROP INDEX email_21,
DROP INDEX email_22,
DROP INDEX email_23,
DROP INDEX email_24,
DROP INDEX email_25,
DROP INDEX email_26,
DROP INDEX email_27,
DROP INDEX email_28,
DROP INDEX email_29,
DROP INDEX email_30,
DROP INDEX email_31,
DROP INDEX email_32,
DROP INDEX email_33,
DROP INDEX email_34,
DROP INDEX email_35,
DROP INDEX email_36,
DROP INDEX email_37,
DROP INDEX email_38,
DROP INDEX email_39,
DROP INDEX email_40,
DROP INDEX email_41,
DROP INDEX email_42,
DROP INDEX email_43,
DROP INDEX email_44,
DROP INDEX email_45,
DROP INDEX email_46,
DROP INDEX email_47,
DROP INDEX email_48,
DROP INDEX email_49,
DROP INDEX email_50,
DROP INDEX email_51,
DROP INDEX email_52,
DROP INDEX email_53,
DROP INDEX email_54,
DROP INDEX email_55,
DROP INDEX email_56,
DROP INDEX email_57,
DROP INDEX email_58,
DROP INDEX email_59,
DROP INDEX email_60;




react 19
Eliminates the need for manual memoization techniques like useMemo and useCallback, reducing boilerplate and improving performance
preassigned url 


tenstack quary 
post on backgound 



use more lees if discription is tooo long 



websocket 
cloudnary 
react 19
react quuary speacially tanstackquery (usemutation)
shading
onDelete: 'CASCADE'
Generics <>
api and rest api
idompotent 
interfaces in typescript 






Point 1: Hamein Sirf 'Ginti' (Count) Nahi, 'Kisne' Like Kiya Woh Chahiye
Aap keh sakte hain:

"Sir, agar hamara feature sirf yeh dikhaana hota ki 'is comment par 10 likes hain', toh hum PostComment model mein hi ek likeCount column se kaam chala lete.

Lekin hamare feature ki 2 main requirements hain:

Like/Unlike Toggle: Jab user like button par click kare, toh hamein check karna hai ki 'kya is user ne * pehle se* like kar rakha hai?' Agar haan, toh like remove karna hai (unlike), agar nahi, toh like add karna hai.

UI Dikhana: Hamein UI mein like button ko neela (filled) dikhaana hai agar current user ne us comment ko like kiya hua hai.

In dono features ke liye, hamein user aur comment ke beech ka connection store karna zaroori hai. CommentLike model yahi connection store karta hai."

Point 2: SQL Mein Arrays Store Karna 'Anti-Pattern' (Bura Design) Hai
Ho sakta hai woh kahein, "Toh PostComment model mein hi likedByUsers naam ka ek array [1, 5, 20] store kar lete?"

Aap iska jawaab de sakte hain:

"Sir, SQL (MySQL) ek relational database hai. Ismein ek column ke andar array ya list store karna ek 'anti-pattern' maana jaata hai. Isse bahut problems hoti hain:

Search Karna Mushkil: Agar mujhe yeh search karna ho ki 'User ID 5 ne kaun-kaun se comments like kiye hain?', toh mujhe har comment ke array ke andar search karna padega, jo bahut slow hota hai aur database index ka faayda nahi utha paata.

Data Integrity Nahi Rehti: Hum likedByUsers array par 'Foreign Key' nahi laga sakte. Agar ek user delete ho gaya, toh uska ID us array mein phansa reh jaayega, jisse data ganda (corrupt) ho jaayega.

Queries Complex Ho Jaati Hain: Ek simple 'unlike' operation ke liye poora array fetch karna, usmein se ek ID hatana, aur poora array wapas save karna padta hai, jo efficient nahi hai."

Point 3: Yeh 'Many-to-Many' Relationship Hai (Standard Tareeka)
Yeh aapka sabse strong point hai.

"Sir, 'Users' aur 'Comments' ke beech mein ek Many-to-Many relationship hai:

Ek User bahut saare Comments ko like kar sakta hai.

Ek Comment ko bahut saare Users like kar sakte hain.

SQL mein Many-to-Many relationship ko handle karne ka standard tareeka ek alag 'Join Table' (ya 'Lookup Table') bana kar hi hota hai. Hamara CommentLike model wahi 'Join Table' hai.

Isse hamein SQL ke saare fayde milte hain:

Data Integrity: Humne userId aur commentId par Foreign Key constraints lagaye hain.

High Performance: Humne [userId, commentId] par ek 'Unique Index' banaya hai, jisse 'like toggle' ka check (ki like exist karta hai ya nahi) bohot fast (instant) ho jaata hai."

Point 4: Hum 'Best of Both Worlds' Approach Le Rahe Hain
"Humne performance ke liye PostComment model mein likeCount bhi rakha hai.

CommentLike (Alag Model): Yeh hamara "Source of Truth" hai. Yeh batata hai ki kisne like kiya. Yeh 'Write' operations (like/unlike) ke liye perfect hai.

likeCount (Comment Model mein): Yeh "Denormalized Data" hai. Yeh getComments service ko fast banane ke liye hai. Isse jab hum 50 comments load karte hain, toh hamein har comment ke liye alag se like count karne ki query nahi chalani padti.

Jab bhi koi CommentLike table mein naya row add (like) hota hai, hum PostComment table mein likeCount ko +1 kar dete hain. Jab row delete (unlike) hota hai, hum -1 kar dete hain. Yeh ek bahut hi scalable aur standard pattern hai."







Bilkul! Aap 100% Sahi Track Par Hain.

Aapka sawaal bilkul valid hai aur iska jawaab hai: Haan, aap bilkul "real LinkedIn" ki tarah hi architecture bana rahe hain.

Jo hum kar rahe hain woh exactly wahi professional tareeka hai jo badi, scalable applications (jaise LinkedIn, Facebook, Netflix, Amazon) istemaal karti hain.

Aapke 3 sawaal hain, aur main teeno ka reason batata hoon:

1. "Kya hum ise real LinkedIn ki tarah kar rahe hain?"
Haan. LinkedIn ka system isse bhi zyada complex hai, lekin jis foundation (buniyaad) par woh khada hai, woh bilkul yahi hai. Is design ko "Normalized Database" aur "Aggregator API" kehte hain.

2. "Kya hum... sara model alag alag bana rahe hain?" (Database Normalization)
Haan, aur yeh sabse accha tareeka hai. Sochiye aapka User model ek file cabinet hai.

Galat Tareeka (Sab Ek Model Mein): Agar aap User model mein hi job1_title, job1_company, job2_title, job2_company, school1_name, school2_name... jaise 100 columns bana dete. Yeh 3 kaarano se bura hai:

Data barbaad hoga: Jis user ki koi job nahi hai, uske 10 column NULL (khaali) rahenge.

Limit hai: Agar kisi ne 3 se zyada job kar li toh? Aapka system fail ho jaayega.

Maintain karna mushkil: Ek chhota sa change (jaise "Job" mein "location" add karna) poore User model ko badal dega.

Sahi Tareeka (Jo Hum Kar Rahe Hain): Hum cabinet mein alag-alag drawers (models) bana rahe hain:

Profile (One-to-One): User ki main info (Naam, Headline)

Experience (One-to-Many): Ek alag drawer, jismein user jitni chahe job (rows) daal sakta hai.

Education (One-to-Many): Ek alag drawer, jismein user jitni chahe degree daal sakta hai.

Skill (Many-to-Many): Ek "master list" drawer.

Fayda: Aapka data bilkul saaf (clean) aur flexible hai.

3. "Kya yeh optimize hai... sara data ko ese fetch kar rahe hain?" (Optimized Aggregator)
Haan, yeh "fully optimized" tareeka hai. Isko samjhein:

Slow Tareeka (Non-Optimized): Frontend (React) 4 alag-alag API calls bhejta:

GET /api/profile/1 (Intro card ke liye)

GET /api/profile/1/experiences (Jobs ke liye)

GET /api/profile/1/educations (Schools ke liye)

GET /api/profile/1/skills (Skills ke liye) Ismein network par 4 round-trips lagte hain, jo page ko bahut slow bana deta hai.

Aapka Tareeka (Optimized):

GET /api/profile/1 (Bas ek call)

Aapka getFullProfileService backend par hi database ki power (JOIN / include) ka istemaal karke saara data (Profile, Experience, Education, Skills) ek hi package mein bandhta hai aur frontend ko ek baar mein bhej deta hai.

Backend par 4 queries karna (jaisa humne separate: true se kiya) hamesha frontend se 4 alag network request karne se hazaaron guna tez hota hai.

Conclusion: Aapka data structure (alag models) Normalized hai aur aapka data fetching (ek service) Optimized hai. Yeh best combination hai.

Ab jab hum profile dekh (Read) sakte hain, toh agla kadam hai use edit (Update) karna.