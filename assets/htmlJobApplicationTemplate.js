const moment = require("moment");
const cloudinary = require("cloudinary");

const htmlTemplate = (payload) => {
  let experienceList = "";
  let educationList = "";
  let certificationList = "";
  let skillList = "";

  if (payload.experience && payload.experience.length > 0) {
    payload.experience
      .sort((a, b) => b.startDate - a.startDate)
      .map((exp) => {
        experienceList =
          experienceList +
          `
            <div style="font-family: inherit; text-align: inherit">
            <p>Periode: <strong>${moment(exp.startDate).format(
              "MMMM YYYY"
            )} - ${
            exp.endDate ? moment(exp.endDate).format("MMMM YYYY") : "Sekarang"
          }</strong></p>
               <ul style="list-style:none; margin:0; padding-left: 0">
                  <li>Jabatan: <strong>${exp.prevTitle}</strong></li>
                  <li>Perusahaan: <strong>${exp.prevCompany}</strong></li>
                  <li>Deskripsi: <strong>${exp.description}</strong></li>
               </ul>
            </div>
            <br/>
            `;
      });
  } else {
    experienceList = "Belum Ada";
  }

  if (payload.education && payload.education.length > 0) {
    payload.education
      .sort((a, b) => b.startDate - a.startDate)
      .map((edu) => {
        educationList =
          educationList +
          `
            <div style="font-family: inherit; text-align: inherit">
            <p>Periode: <strong>${moment(edu.startDate).format(
              "MMMM YYYY"
            )} - ${
            edu.endDate ? moment(edu.endDate).format("MMMM YYYY") : "Sekarang"
          }</strong></p>
               <ul style="list-style:none; margin:0; padding-left: 0">
                  <li>Major: <strong>${edu.major}</strong></li>
                  <li>Jenjang Pendidikan: <strong>${edu.degree}</strong></li>
                  <li>Sekolah/Institusi: <strong>${edu.school}</strong></li>
                  <li>Deskripsi: <strong>${edu.description}</strong></li>
               </ul>
            </div>
            <br/>
            `;
      });
  } else {
    educationList = "Belum Ada";
  }

  if (payload.certification && payload.certification.length > 0) {
    payload.certification
      .sort((a, b) => b.startDate - a.startDate)
      .map((cert) => {
        certificationList =
          certificationList +
          `
            <div style="font-family: inherit; text-align: inherit">
            <p>Periode: <strong>${moment(cert.startDate).format(
              "MMMM YYYY"
            )} - ${
            cert.endDate
              ? moment(cert.endDate).format("MMMM YYYY")
              : "Seumur Hidup"
          }</strong></p>
               <ul style="list-style:none; margin:0; padding-left: 0">
                  <li>Sertifikasi: <strong>${cert.title}</strong></li>
                  <li>Organisasi/Institusi: <strong>${
                    cert.organization
                  }</strong></li>
                  <li>Deskripsi: <strong>${cert.description}</strong></li>
               </ul>
            </div>
            <br/>
            `;
      });
  } else {
    certificationList = "Belum Ada";
  }

  if (payload.skills && payload.skills.length > 0) {
    payload.skills.map((skill) => {
      skillList =
        skillList +
        `
               <li><strong>${skill}</strong></li>     
            `;
    });
  } else {
    skillList = "Belum Ada";
  }


	let resume = payload.resume && payload.resume


  return `
   <!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd">
   <html data-editor-version="2" class="sg-campaigns" xmlns="http://www.w3.org/1999/xhtml">

   <head>
   <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
   <meta name="viewport" content="width=device-width, initial-scale=1, minimum-scale=1, maximum-scale=1">
   <!--[if !mso]><!-->
   <meta http-equiv="X-UA-Compatible" content="IE=Edge">
   <!--<![endif]-->
   <!--[if (gte mso 9)|(IE)]>
         <xml>
         <o:OfficeDocumentSettings>
            <o:AllowPNG/>
            <o:PixelsPerInch>96</o:PixelsPerInch>
         </o:OfficeDocumentSettings>
         </xml>
         <![endif]-->
   <!--[if (gte mso 9)|(IE)]>
   <style type="text/css">
      body {width: 600px;margin: 0 auto;}
      table {border-collapse: collapse;}
      table, td {mso-table-lspace: 0pt;mso-table-rspace: 0pt;}
      img {-ms-interpolation-mode: bicubic;}
   </style>
   <![endif]-->
   <style type="text/css">
      body,
      p,
      div {
         font-family: arial, helvetica, sans-serif;
         font-size: 14px;
      }

      body {
         color: #000000;
      }

      body a {
         color: #1188E6;
         text-decoration: none;
      }

      p {
         margin: 0;
         padding: 0;
      }

      table.wrapper {
         width: 100% !important;
         table-layout: fixed;
         -webkit-font-smoothing: antialiased;
         -webkit-text-size-adjust: 100%;
         -moz-text-size-adjust: 100%;
         -ms-text-size-adjust: 100%;
      }

      img.max-width {
         max-width: 100% !important;
      }

      .column.of-2 {
         width: 50%;
      }

      .column.of-3 {
         width: 33.333%;
      }

      .column.of-4 {
         width: 25%;
      }

      @media screen and (max-width:480px) {

         .preheader .rightColumnContent,
         .footer .rightColumnContent {
         text-align: left !important;
         }

         .preheader .rightColumnContent div,
         .preheader .rightColumnContent span,
         .footer .rightColumnContent div,
         .footer .rightColumnContent span {
         text-align: left !important;
         }

         .preheader .rightColumnContent,
         .preheader .leftColumnContent {
         font-size: 80% !important;
         padding: 5px 0;
         }

         table.wrapper-mobile {
         width: 100% !important;
         table-layout: fixed;
         }

         img.max-width {
         height: auto !important;
         max-width: 100% !important;
         }

         a.bulletproof-button {
         display: block !important;
         width: auto !important;
         font-size: 80%;
         padding-left: 0 !important;
         padding-right: 0 !important;
         }

         .columns {
         width: 100% !important;
         }

         .column {
         display: block !important;
         width: 100% !important;
         padding-left: 0 !important;
         padding-right: 0 !important;
         margin-left: 0 !important;
         margin-right: 0 !important;
         }

         .social-icon-column {
         display: inline-block !important;
         }
      }
   </style>
   <!--user entered Head Start-->
   <!--End Head user entered-->
   </head>

<body>
  <center class="wrapper" data-link-color="#1188E6"
    data-body-style="font-size:14px; font-family:arial,helvetica,sans-serif; color:#000000; background-color:#FFFFFF;">
    <div class="webkit">
      <table cellpadding="0" cellspacing="0" border="0" width="100%" class="wrapper" bgcolor="#FFFFFF">
        <tr>
          <td valign="top" bgcolor="#FFFFFF" width="100%">
            <table width="100%" role="content-container" class="outer" align="center" cellpadding="0" cellspacing="0"
              border="0">
              <tr>
                <td width="100%">
                  <table width="100%" cellpadding="0" cellspacing="0" border="0">
                    <tr>
                      <td>
                        <!--[if mso]>
    <center>
    <table><tr><td width="600">
  <![endif]-->
                        <table width="100%" cellpadding="0" cellspacing="0" border="0"
                          style="width:100%; max-width:600px;" align="center">
                          <tr>
                            <td role="modules-container"
                              style="padding:0px 0px 0px 0px; color:#000000; text-align:left;" bgcolor="#FFFFFF"
                              width="100%" align="left">
                              <table class="module preheader preheader-hide" role="module" data-type="preheader"
                                border="0" cellpadding="0" cellspacing="0" width="100%"
                                style="display: none !important; mso-hide: all; visibility: hidden; opacity: 0; color: transparent; height: 0; width: 0;">
                                <tr>
                                  <td role="module-content">
                                    <p></p>
                                  </td>
                                </tr>
                              </table>
                              <table class="module" role="module" data-type="text" border="0" cellpadding="0"
                                cellspacing="0" width="100%" style="table-layout: fixed;"
                                data-muid="6174b068-a25f-4a48-bdc6-93e7ce1ab46b" data-mc-module-version="2019-10-22">
                                <tbody>
                                  <tr>
                                    <td style="padding:18px 0px 6px 0px; line-height:22px; text-align:inherit;"
                                      height="100%" valign="top" bgcolor="" role="module-content">
                                      <div>
                                        <div style="font-family: inherit; text-align: inherit">Yth. Human Resource Department ${
                                          payload.companyName
                                        }</div>
                                        <div style="font-family: inherit; text-align: inherit">di tempat,</div>
                                        <div style="font-family: inherit; text-align: inherit"><br></div>
                                        <div style="font-family: inherit; text-align: inherit">Berikut resume <span
                                            style="font-weight: normal; font-size: 14px; line-height: 19px; white-space: pre; background-color: rgb(255, 255, 255); color: #000000; font-family: arial, helvetica, sans-serif">dan&nbsp;biodata&nbsp;saya&nbsp;untuk&nbsp;melamar&nbsp;pekerjaan&nbsp;di&nbsp;posisi</span><span
                                            style="background-color: rgb(255, 255, 255); color: #000000; font-family: arial, helvetica, sans-serif">&nbsp;</span>
                                        </div>
                                        <div></div>
                                      </div>
                                    </td>
                                  </tr>
                                </tbody>
                              </table>
                              <table class="module" role="module" data-type="divider" border="0" cellpadding="0"
                                cellspacing="0" width="100%" style="table-layout: fixed;"
                                data-muid="37595f30-a40b-475a-918e-615b734406d4">
                                <tbody>
                                  <tr>
                                    <td style="padding:0px 0px 0px 0px;" role="module-content" height="100%"
                                      valign="top" bgcolor="">
                                      <table border="0" cellpadding="0" cellspacing="0" align="center" width="100%"
                                        height="3px" style="line-height:3px; font-size:3px;">
                                        <tbody>
                                          <tr>
                                            <td style="padding:0px 0px 3px 0px;" bgcolor="#000000"></td>
                                          </tr>
                                        </tbody>
                                      </table>
                                    </td>
                                  </tr>
                                </tbody>
                              </table>
                              <table border="0" cellpadding="0" cellspacing="0" align="center" width="100%"
                                role="module" data-type="columns" style="padding:0px 0px 0px 0px;" bgcolor="#FFFFFF"
                                data-distribution="1,2">
                                <tbody>
                                  <tr role="module-content">
                                    <td height="100%" valign="top">
                                      <table width="193"
                                        style="width:193px; border-spacing:0; border-collapse:collapse; margin:0px 10px 0px 0px;"
                                        cellpadding="0" cellspacing="0" align="left" border="0" bgcolor=""
                                        class="column column-0">
                                        <tbody>
                                          <tr>
                                            <td style="padding:0px;margin:0px;border-spacing:0;">
                                              <table class="module" role="module" data-type="text" border="0"
                                                cellpadding="0" cellspacing="0" width="100%"
                                                style="table-layout: fixed;"
                                                data-muid="ab6066d9-7481-4a34-b2bb-d327d15ccf5d">
                                                <tbody>
                                                  <tr>
                                                    <td
                                                      style="padding:18px 0px 18px 0px; line-height:22px; text-align:inherit;"
                                                      height="100%" valign="top" bgcolor="" role="module-content">
                                                      <div>
																		  <div style="font-family: inherit; width: 200px; height: 250px; text-align: center;">
																		 <img alt="avatar" src="${
                                       payload.avatarUrl
                                     }" style="max-width: 100%; max-height: 100%; "/> 
																		  </div>
                                                        <div></div>
                                                      </div>
                                                    </td>
                                                  </tr>
                                                </tbody>
                                              </table>
                                            </td>
                                          </tr>
                                        </tbody>
                                      </table>
                                      <table width="386"
                                        style="width:386px; border-spacing:0; border-collapse:collapse; margin:0px 0px 0px 10px;"
                                        cellpadding="0" cellspacing="0" align="left" border="0" bgcolor=""
                                        class="column column-1">
                                        <tbody>
                                          <tr>
                                            <td style="padding:0px;margin:0px;border-spacing:0;">
                                              <table class="module" role="module" data-type="text" border="0"
                                                cellpadding="0" cellspacing="0" width="100%"
                                                style="table-layout: fixed;"
                                                data-muid="a80d008e-d7ef-4870-af58-e593d862118a"
                                                data-mc-module-version="2019-10-22">
                                                <tbody>
                                                  <tr>
                                                    <td
                                                      style="padding:18px 0px 18px 0px; line-height:32px; text-align:inherit;"
                                                      height="100%" valign="top" bgcolor="" role="module-content">
                                                      <div>
                                                        <div style="font-family: inherit; text-align: inherit">Nama: <strong>${
                                                          payload.firstName
                                                        } ${
    payload.lastName
  } </strong>
                                                        </div>
                                                        <div style="font-family: inherit; text-align: inherit">Usia: <strong>${moment().diff(
                                                          payload.dateOfBirth,
                                                          "years",
                                                          false
                                                        )} tahun </strong>
                                                        </div>
																		  <div style="font-family: inherit; text-align: inherit">Jenis Kelamin: <strong>${
                                        payload.gender
                                      } </strong>
																		  </div>
                                                        <div style="font-family: inherit; text-align: inherit">Email: <strong>${
                                                          payload.email
                                                        } </strong>
                                                        </div>
                                                        <div style="font-family: inherit; text-align: inherit">Alamat: <strong>${
                                                          payload.address
                                                        } </strong>
                                                        </div>
                                                        <div style="font-family: inherit; text-align: inherit">No. Telp: <strong>${
                                                          payload.phone
                                                        } </strong>
                                                        </div>
                                                        <div style="font-family: inherit; text-align: inherit">Bersedia bekerja di luar kota asal: <strong>${
                                                          payload.outOfTown
                                                            ? '<span style="color: green;">BERSEDIA</span>'
                                                            : '<span style="color: maroon;">TIDAK</span>'
                                                        } </strong>
                              </div>
                              <div style="font-family: inherit; text-align: inherit">Bersedia bekerja sistem shift: <strong>${
                                payload.workShifts
                                  ? '<span style="color: green;">BERSEDIA</span>'
                                  : '<span style="color: maroon;">TIDAK</span>'
                              } </strong>
                              </div>
                              <div style="font-family: inherit; text-align: inherit">Resume: <strong><a href='${
                                resume || "#"
                              }'>Resume Link</a></strong>
                              </div>
                                                        <div></div>
                                                      </div>
                                                    </td>
                                                  </tr>
                                                </tbody>
                                              </table>
                                            </td>
                                          </tr>
                                        </tbody>
                                      </table>
                                    </td>
                                  </tr>
                                </tbody>
                              </table>
                              <table class="module" role="module" data-type="divider" border="0" cellpadding="0"
                                cellspacing="0" width="100%" style="table-layout: fixed;"
                                data-muid="37595f30-a40b-475a-918e-615b734406d4.1.1.1">
                                <tbody>
                                  <tr>
                                    <td style="padding:0px 0px 0px 0px;" role="module-content" height="100%"
                                      valign="top" bgcolor="">
                                      <table border="0" cellpadding="0" cellspacing="0" align="center" width="100%"
                                        height="3px" style="line-height:3px; font-size:3px;">
                                        <tbody>
                                          <tr>
                                            <td style="padding:0px 0px 3px 0px;" bgcolor="#000000"></td>
                                          </tr>
                                        </tbody>
                                      </table>
                                    </td>
                                  </tr>
                                </tbody>
                              </table>
                              <table class="module" role="module" data-type="text" border="0" cellpadding="0"
                                cellspacing="0" width="100%" style="table-layout: fixed;"
                                data-muid="795a6980-3b70-4a75-b821-e3e585518c48.1" data-mc-module-version="2019-10-22">
                                <tbody>
                                  <tr>
                                    <td style="padding:5px 0px 0px 0px; line-height:22px; text-align:inherit;"
                                      height="100%" valign="top" bgcolor="" role="module-content">
                                      <div>
                                        <div style="font-family: inherit; text-align: inherit"><span
                                            style="font-size: 18px; font-family: arial, helvetica, sans-serif"><strong>HEADLINE</strong></span>
                                        </div>
                                        <div></div>
                                      </div>
                                    </td>
                                  </tr>
                                </tbody>
                              </table>
                              <table class="module" role="module" data-type="text" border="0" cellpadding="0"
                                cellspacing="0" width="100%" style="table-layout: fixed;"
                                data-muid="52f051be-fb96-4153-8579-b760f38854ef.1" data-mc-module-version="2019-10-22">
                                <tbody>
                                  <tr>
                                    <td style="padding:18px 0px 18px 0px; line-height:22px; text-align:inherit;"
                                      height="100%" valign="top" bgcolor="" role="module-content">
                                      <div>
                                        <div style="font-family: inherit; text-align: inherit">${
                                          payload.details
                                        }
                                        </div>
                                        <div></div>
                                      </div>
                                    </td>
                                  </tr>
                                </tbody>
                              </table>
                              <table class="module" role="module" data-type="divider" border="0" cellpadding="0"
                                cellspacing="0" width="100%" style="table-layout: fixed;"
                                data-muid="37595f30-a40b-475a-918e-615b734406d4.1.1">
                                <tbody>
                                  <tr>
                                    <td style="padding:0px 0px 0px 0px;" role="module-content" height="100%"
                                      valign="top" bgcolor="">
                                      <table border="0" cellpadding="0" cellspacing="0" align="center" width="100%"
                                        height="3px" style="line-height:3px; font-size:3px;">
                                        <tbody>
                                          <tr>
                                            <td style="padding:0px 0px 3px 0px;" bgcolor="#000000"></td>
                                          </tr>
                                        </tbody>
                                      </table>
                                    </td>
                                  </tr>
                                </tbody>
                              </table>
                              <table class="module" role="module" data-type="text" border="0" cellpadding="0"
                                cellspacing="0" width="100%" style="table-layout: fixed;"
                                data-muid="795a6980-3b70-4a75-b821-e3e585518c48.1.1"
                                data-mc-module-version="2019-10-22">
                                <tbody>
                                  <tr>
                                    <td style="padding:5px 0px 0px 0px; line-height:22px; text-align:inherit;"
                                      height="100%" valign="top" bgcolor="" role="module-content">
                                      <div>
                                        <div style="font-family: inherit; text-align: inherit"><span
                                            style="font-size: 18px; font-family: arial, helvetica, sans-serif"><strong>PENGALAMAN
                                              KERJA</strong></span></div>
                                        <div></div>
                                      </div>
                                    </td>
                                  </tr>
                                </tbody>
                              </table>
                              <table class="module" role="module" data-type="text" border="0" cellpadding="0"
                                cellspacing="0" width="100%" style="table-layout: fixed;"
                                data-muid="52f051be-fb96-4153-8579-b760f38854ef.1.1"
                                data-mc-module-version="2019-10-22">
                                <tbody>
                                  <tr>
                                    <td style="padding:18px 0px 18px 0px; line-height:22px; text-align:inherit;"
                                      height="100%" valign="top" bgcolor="" role="module-content">
                                      <div>
                                      ${experienceList}
                                      </div>
                                    </td>
                                  </tr>
                                </tbody>
                              </table>
                              <table class="module" role="module" data-type="divider" border="0" cellpadding="0"
                                cellspacing="0" width="100%" style="table-layout: fixed;"
                                data-muid="37595f30-a40b-475a-918e-615b734406d4.1">
                                <tbody>
                                  <tr>
                                    <td style="padding:0px 0px 0px 0px;" role="module-content" height="100%"
                                      valign="top" bgcolor="">
                                      <table border="0" cellpadding="0" cellspacing="0" align="center" width="100%"
                                        height="3px" style="line-height:3px; font-size:3px;">
                                        <tbody>
                                          <tr>
                                            <td style="padding:0px 0px 3px 0px;" bgcolor="#000000"></td>
                                          </tr>
                                        </tbody>
                                      </table>
                                    </td>
                                  </tr>
                                </tbody>
                              </table>
                              <table class="module" role="module" data-type="text" border="0" cellpadding="0"
                                cellspacing="0" width="100%" style="table-layout: fixed;"
                                data-muid="795a6980-3b70-4a75-b821-e3e585518c48" data-mc-module-version="2019-10-22">
                                <tbody>
                                  <tr>
                                    <td style="padding:5px 0px 0px 0px; line-height:22px; text-align:inherit;"
                                      height="100%" valign="top" bgcolor="" role="module-content">
                                      <div>
                                        <div style="font-family: inherit; text-align: inherit"><span
                                            style="font-size: 18px; font-family: arial, helvetica, sans-serif"><strong>RIWAYAT
                                              PENDIDIKAN</strong></span></div>
                                        <div></div>
                                      </div>
                                    </td>
                                  </tr>
                                </tbody>
                              </table>
                              <table class="module" role="module" data-type="text" border="0" cellpadding="0"
                                cellspacing="0" width="100%" style="table-layout: fixed;"
                                data-muid="52f051be-fb96-4153-8579-b760f38854ef.2" data-mc-module-version="2019-10-22">
                                <tbody>
                                  <tr>
                                    <td style="padding:18px 0px 18px 0px; line-height:22px; text-align:inherit;"
                                      height="100%" valign="top" bgcolor="" role="module-content">
                                      <div>
                                        ${educationList}
                                      </div>
                                    </td>
                                  </tr>
                                </tbody>
                              </table>
                              <table class="module" role="module" data-type="divider" border="0" cellpadding="0"
                                cellspacing="0" width="100%" style="table-layout: fixed;"
                                data-muid="37595f30-a40b-475a-918e-615b734406d4.1.2.1">
                                <tbody>
                                  <tr>
                                    <td style="padding:0px 0px 0px 0px;" role="module-content" height="100%"
                                      valign="top" bgcolor="">
                                      <table border="0" cellpadding="0" cellspacing="0" align="center" width="100%"
                                        height="3px" style="line-height:3px; font-size:3px;">
                                        <tbody>
                                          <tr>
                                            <td style="padding:0px 0px 3px 0px;" bgcolor="#000000"></td>
                                          </tr>
                                        </tbody>
                                      </table>
                                    </td>
                                  </tr>
                                </tbody>
                              </table>
                              <table class="module" role="module" data-type="text" border="0" cellpadding="0"
                                cellspacing="0" width="100%" style="table-layout: fixed;"
                                data-muid="795a6980-3b70-4a75-b821-e3e585518c48.2.1"
                                data-mc-module-version="2019-10-22">
                                <tbody>
                                  <tr>
                                    <td style="padding:5px 0px 0px 0px; line-height:22px; text-align:inherit;"
                                      height="100%" valign="top" bgcolor="" role="module-content">
                                      <div>
                                        <div style="font-family: inherit; text-align: inherit"><span
                                            style="font-size: 18px; font-family: arial, helvetica, sans-serif"><strong>SERTIFIKASI</strong></span>
                                        </div>
                                        <div></div>
                                      </div>
                                    </td>
                                  </tr>
                                </tbody>
                              </table>
                              <table class="module" role="module" data-type="text" border="0" cellpadding="0"
                                cellspacing="0" width="100%" style="table-layout: fixed;"
                                data-muid="52f051be-fb96-4153-8579-b760f38854ef.3" data-mc-module-version="2019-10-22">
                                <tbody>
                                  <tr>
                                    <td style="padding:18px 0px 18px 0px; line-height:22px; text-align:inherit;"
                                      height="100%" valign="top" bgcolor="" role="module-content">
                                      <div>
                                        ${certificationList}
                                      </div>
                                    </td>
                                  </tr>
                                </tbody>
                              </table>
                              <table class="module" role="module" data-type="divider" border="0" cellpadding="0"
                                cellspacing="0" width="100%" style="table-layout: fixed;"
                                data-muid="37595f30-a40b-475a-918e-615b734406d4.1.2">
                                <tbody>
                                  <tr>
                                    <td style="padding:0px 0px 0px 0px;" role="module-content" height="100%"
                                      valign="top" bgcolor="">
                                      <table border="0" cellpadding="0" cellspacing="0" align="center" width="100%"
                                        height="3px" style="line-height:3px; font-size:3px;">
                                        <tbody>
                                          <tr>
                                            <td style="padding:0px 0px 3px 0px;" bgcolor="#000000"></td>
                                          </tr>
                                        </tbody>
                                      </table>
                                    </td>
                                  </tr>
                                </tbody>
                              </table>
                              <table class="module" role="module" data-type="text" border="0" cellpadding="0"
                                cellspacing="0" width="100%" style="table-layout: fixed;"
                                data-muid="795a6980-3b70-4a75-b821-e3e585518c48.2" data-mc-module-version="2019-10-22">
                                <tbody>
                                  <tr>
                                    <td style="padding:5px 0px 0px 0px; line-height:22px; text-align:inherit;"
                                      height="100%" valign="top" bgcolor="" role="module-content">
                                      <div>
                                        <div style="font-family: inherit; text-align: inherit"><span
                                            style="font-size: 18px; font-family: arial, helvetica, sans-serif"><strong>TECHNICAL SKILLS</strong></span></div>
                                        <div></div>
                                      </div>
                                    </td>
                                  </tr>
                                </tbody>
                              </table>
                              <table class="module" role="module" data-type="text" border="0" cellpadding="0"
                                cellspacing="0" width="100%" style="table-layout: fixed;"
                                data-muid="52f051be-fb96-4153-8579-b760f38854ef" data-mc-module-version="2019-10-22">
                                <tbody>
                                  <tr>
                                    <td style="padding:18px 0px 18px 0px; line-height:22px; text-align:inherit;"
                                      height="100%" valign="top" bgcolor="" role="module-content">
                                      <div>
                                        <div style="font-family: inherit; text-align: inherit">
                                        <ul style="list-style:none; margin:0; padding-left: 0">
                                          ${skillList}
                                        </ul>
                                        </div>
                                        <div></div>
                                      </div>
                                    </td>
                                  </tr>
                                </tbody>
                              </table>
                            </td>
                          </tr>
                        </table>
                        <!--[if mso]>
                                  </td>
                                </tr>
                              </table>
                            </center>
                            <![endif]-->
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </div>
  </center>
</body>

</html>
   `;
};

module.exports = htmlTemplate;
