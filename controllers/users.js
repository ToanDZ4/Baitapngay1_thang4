let userModel = require('../schemas/users');
let roleModel = require('../schemas/roles');
let mailHandler = require('../utils/mailHandler');
const ExcelJS = require('exceljs');
const crypto = require('crypto');

module.exports = {
    CreateAnUser: async function (username, password, email, role, session,
        fullName, avatarUrl, status, loginCount) {
        let newItem = new userModel({
            username: username,
            password: password,
            email: email,
            fullName: fullName,
            avatarUrl: avatarUrl,
            status: status,
            role: role,
            loginCount: loginCount
        });
        if (session) {
            await newItem.save({ session });
        } else {
            await newItem.save();
        }
        return newItem;
    },
    ImportUsers: async function (filePath) {
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.readFile(filePath);
        const worksheet = workbook.worksheets[0];
        
        let roleUser = await roleModel.findOne({ name: { $in: ['user', 'USER', 'User'] } });
        if (!roleUser) {
            // Nếu database chưa có role USER, tự động tạo mới để tránh lỗi
            roleUser = new roleModel({
                name: 'USER',
                description: 'Người dùng mặc định'
            });
            await roleUser.save();
        }

        const usersCount = worksheet.rowCount;
        let createdUsers = [];
        let errors = [];

        for (let i = 2; i <= usersCount; i++) {
            const row = worksheet.getRow(i);
            const username = row.getCell(1).value?.toString().trim() || row.getCell(1).text?.toString().trim();
            const valEmail = row.getCell(2).value;
            let email = "";
            if (valEmail) {
                if (typeof valEmail === 'object') {
                    email = valEmail.text || valEmail.hyperlink || valEmail.result?.toString() || JSON.stringify(valEmail);
                    email = email.replace('mailto:', '');
                } else {
                    email = valEmail.toString();
                }
            }
            email = email.trim();
            
            if (email === '[object Object]') {
                email = "invalid_email_" + i + "@example.com"; // Fallback để báo lỗi dễ hiểu hơn nếu không parse được
            }

            if (username && email) {
                try {
                    const existingUser = await userModel.findOne({ $or: [{ username: username }, { email: email }] });
                    if (existingUser) {
                        errors.push(`Dòng ${i}: Username = ${username} hoặc Email = ${email} đã tồn tại`);
                        continue;
                    }

                    const password = crypto.randomBytes(8).toString('hex'); // 16 kí tự ngẫu nhiên

                    let newItem = new userModel({
                        username: username,
                        password: password,
                        email: email,
                        role: roleUser._id,
                        status: true 
                    });

                    await newItem.save();
                    
                    try {
                        await mailHandler.sendPasswordMail(email, password);
                    } catch (mailErr) {
                         errors.push(`Dòng ${i}: Tạo user thành công nhưng không gửi được mail - ${mailErr.message}`);
                    }
                    
                    createdUsers.push(username);
                } catch (err) {
                    errors.push(`Dòng ${i}: Lỗi - ${err.message}`);
                }
            } else if (username || email) {
                 errors.push(`Dòng ${i}: Thiếu Username hoặc Email`);
            }
        }

        return {
            message: "Hoàn tất import Excel",
            successCount: createdUsers.length,
            createdUsers: createdUsers,
            errors: errors
        };
    },
    GetAnUserByUsername: async function (username) {
        return await userModel.findOne({
            isDeleted: false,
            username: username
        })
    }, GetAnUserById: async function (id) {
        return await userModel.findOne({
            isDeleted: false,
            _id: id
        }).populate('role')
    }, GetAnUserByEmail: async function (email) {
        return await userModel.findOne({
            isDeleted: false,
            email: email
        })
    }, GetAnUserByToken: async function (token) {
        let user = await userModel.findOne({
            isDeleted: false,
            forgotPasswordToken: token
        })
        if (user.forgotPasswordTokenExp > Date.now()) {
            return user;
        }
        return false;
    }
}