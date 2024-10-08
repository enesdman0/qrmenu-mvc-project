const Company = require("../Models/Company");
const Menu = require("../Models/Menu");
const Admin = require("../Models/Admin");
const asyncHandler = require("express-async-handler");
const metaTagCreator = require("../helpers/metaTagCreator")

module.exports.getLogin = asyncHandler(async (req, res, next) => {
    const errors = req.session.errors || [];
    const formData = req.session.formData || {};

    // `errors` ve `formData` her zaman var olabilir, temizlik işlemi `postLogin` içinde yapılır
    req.session.errors = null;
    req.session.formData = null;

    res.render("auth/login", {
        title: "Giriş yap",
        errors: errors,
        formData: formData,
        // csrfToken: req.csrfToken,
        metaTags: metaTagCreator("Giriş yap", `Giriş yap sayfası, ${process.env.SITE_NAME} platformuna erişim sağlar. Kullanıcı adı ve şifre ile giriş yapabilir, hesap oluşturma ve şifre yenileme işlemlerini gerçekleştirebilirsiniz.`, "defaultPageImage.jpg", "/auth/login")
    });
});

module.exports.postLogin = asyncHandler(async (req, res, next) => {
    const { emailAddress, password } = req.body;
    let isAdmin = false
    const errors = [];
    let company = await Company.findOne({ emailAddress: emailAddress }).select("+password");
    if (!company) {
        company = await Admin.findOne({ emailAddress: emailAddress }).select("+password");
        isAdmin = true
    }
    // Form verilerini kaydedin
    req.session.formData = req.body;

    if (company) {
        const isMatch = await company.comparePassword(password);
        if (!isMatch) {
            errors.push("E-posta ve şifreniz uyuşmuyor. Lütfen tekrar deneyin");
            req.session.errors = errors;
            return res.redirect(req.originalUrl);
        } else {
            req.session.isAuth = true;
            req.session.companyId = company._id;
            req.session.name = company.name;
            req.session.email = company.emailAddress;
            req.session.role = isAdmin ? "admin" : "company";
            req.session.telephone = company.telephone;
            req.session.address = company.address;
            req.session.socialMedia = company.socialMedia;
            req.session.qrcode = company.qrcode;
            req.session.photo = company.photo;
            req.session.errors = null; // Başarılı girişte hataları temizleyin
            req.session.formData = null; // Başarılı girişte form verilerini temizleyin
            return res.redirect('/');
        }
    } else {
        errors.push("Bu emaille bağlantılı bir hesap bulamadık");
        req.session.errors = errors;
        return res.redirect(req.originalUrl);
    }
});

module.exports.getRegister = asyncHandler(async (req, res, next) => {
    const errors = req.session.errors || [];
    const formData = req.session.formData || {};

    req.session.errors = null;
    req.session.formData = null;

    res.render("auth/register", {
        title: "Kayıt ol",
        errors: errors,
        formData: formData,
        // csrfToken: req.csrfToken(),
        metaTags: metaTagCreator("Kayıt Ol", `Kayıt sayfası, ${process.env.SITE_NAME} platformunda hızlı ve güvenli bir şekilde yeni hesap oluşturmanızı sağlar. Tüm özelliklere erişim için kişisel bilgilerinizi girin..`, "defaultPageImage.jpg", "/auth/register")
    });
});


module.exports.postRegister = asyncHandler(async (req, res, next) => {
    const { name, emailAddress, telephone, password } = req.body;

    try {
        // Şirket oluştur
        let company = await Company.create({
            name,
            emailAddress,
            telephone,
            password
        });

        let updatedMenu = await Menu.findOneAndUpdate(
            { company: company._id },
            {
                $push: {
                    categories: {
                        name: 'İçecekler',
                        photo: 'cay.jpg',
                        description: 'Ferahlatıcı ve lezzetli içeceklerimizle kendinizi şımartın. Her damak zevkine uygun seçenekler sizi bekliyor!',
                        products: [
                            {
                                name: 'Çay',
                                description: 'Yüksek kaliteli, taze demlenmiş çaylarımızla rahatlatıcı bir molanın tadını çıkarın.',
                                price: 8,
                                photo: 'cay.jpg'
                            }
                        ]
                    }
                }
            },
            { new: true, upsert: true } // Menü bulunmazsa yeni bir tane oluştur
        );

        // Kayıt işlemi başarılı, form verilerini temizleyin
        req.session.errors = null;
        req.session.formData = null;

        res.redirect("/auth/login");
    } catch (error) {
        next(error); // Hata durumunda hata işleme middleware'ine geçiş
    }
});


module.exports.logout = asyncHandler(async (req, res, next) => {
    await req.session.destroy();
    res.redirect('/')
});
