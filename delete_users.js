let mongoose = require('mongoose');
mongoose.connect('mongodb://localhost:27017/NNPTUD-C4').then(async () => {
    let userModel = require('./schemas/users');
    let res = await userModel.deleteMany({ username: /^user/ });
    console.log("Deleted", res.deletedCount, "users");
    process.exit(0);
}).catch(err => {
    console.error(err);
    process.exit(1);
});
