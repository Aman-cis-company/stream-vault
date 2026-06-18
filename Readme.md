backend command for first time
npm install
npm run db:migrate         # create all 9 tables
npm run db:seed            # seed roles, users, plans
npm run dev                # start dev server (port 5000)

frontend command
npm run dev

Admin login
admin@streamvault.com / Admin@123456



bunny.net
username = aman.k@cisinlabs.com
password = Aman@1234567


https://github.com/Aman-cis-company/stream-vault.git



run this command to generate credentials 

node -e "const n = require('nodemailer'); n.createTestAccount().then(a => { console.log('MAIL_USER=' + a.user); console.log('MAIL_PASSWORD=' + a.pass); });"

------------------OPENAI WHISPER for Subtitle----------------
-we use OpenAI whisper free version for auto subtitle generation
-we use whiper as command line (use shell command) 
-Free, but requires Python + Whisper installed on the server

install CLI whiper on local system
commands:-
sudo apt update
sudo apt install python3 python3-pip ffmpeg -y
pip3 install openai-whisper
whisper --help (Verify installation)
