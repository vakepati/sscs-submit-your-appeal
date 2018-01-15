'use strict';

const DateUtils = require('utils/DateUtils');
const paths = require('paths');
const oneMonthAgo = DateUtils.oneMonthAgo();
const textRemindersContent = require('steps/sms-notify/text-reminders/content.en.json');
const haveAMRNContent = require('steps/compliance/have-a-mrn/content.en.json');
const appointeeContent = require('steps/identity/appointee/content.en.json');
const selectors = require('steps/check-your-appeal/selectors');

Feature('Appellant PIP, one month ago, does not attend hearing.');

Before((I) => {
    I.createTheSession();
    I.seeCurrentUrlEquals(paths.start.benefitType);
});

After((I) => {
    I.endTheSession();
});

Scenario('Appellant does not define an optional phone number and does not sign up for text msg reminders.', (I) => {

    IenterDetailsFromStartToNINO(I);
    I.enterAppellantContactDetailsAndContinue();
    I.selectDoYouWantToReceiveTextMessageReminders(textRemindersContent.fields.doYouWantTextMsgReminders.no);
    IenterDetailsFromNoRepresentativeToEnd(I);

    IconfirmDetailsArePresent(I);
    I.see('Not provided', selectors.appellant.phoneNumber);
    I.see('No', selectors.textMsgReminders.receiveTxtMsgReminders);

});

Scenario('Appellant does not define an optional phone number, however, enters mobile for text msg reminders.', (I) => {

    IenterDetailsFromStartToNINO(I);
    I.enterAppellantContactDetailsAndContinue();
    I.selectDoYouWantToReceiveTextMessageReminders(textRemindersContent.fields.doYouWantTextMsgReminders.yes);
    I.enterMobileAndContinue('07455678444');
    I.readSMSConfirmationAndContinue();
    IenterDetailsFromNoRepresentativeToEnd(I);

    IconfirmDetailsArePresent(I);
    I.see('Not provided', selectors.appellant.phoneNumber);
    I.see('07455678444', selectors.textMsgReminders.mobileNumber);

});

Scenario('Appellant defines an optional phone number and signs up for text msg reminders using the same number.', (I) => {

    IenterDetailsFromStartToNINO(I);

    I.enterAppellantContactDetailsWithMobileAndContinue('07411738663');
    I.selectDoYouWantToReceiveTextMessageReminders(textRemindersContent.fields.doYouWantTextMsgReminders.yes);
    I.selectUseSameNumberAndContinue('#useSameNumber-yes');
    I.readSMSConfirmationAndContinue();
    IenterDetailsFromNoRepresentativeToEnd(I);

    IconfirmDetailsArePresent(I);
    I.see('07411738663', selectors.appellant.phoneNumber);
    I.see('07411738663', selectors.textMsgReminders.mobileNumber);

});

Scenario('Appellant defines an optional phone number, then provides an additional mobile number for text msg reminders.', (I) => {

    IenterDetailsFromStartToNINO(I);

    I.enterAppellantContactDetailsWithMobileAndContinue('07411738663');
    I.selectDoYouWantToReceiveTextMessageReminders(textRemindersContent.fields.doYouWantTextMsgReminders.yes);
    I.selectUseSameNumberAndContinue('#useSameNumber-no');
    I.enterMobileAndContinue('07411333333');
    I.readSMSConfirmationAndContinue();
    IenterDetailsFromNoRepresentativeToEnd(I);

    IconfirmDetailsArePresent(I);
    I.see('07411738663', selectors.appellant.phoneNumber);
    I.see('07411333333', selectors.textMsgReminders.mobileNumber);

});

Scenario('Appellant defines an optional phone number, but does not sign up for text msg reminders.', (I) => {

    IenterDetailsFromStartToNINO(I);

    I.enterAppellantContactDetailsWithMobileAndContinue('07411738663');
    I.selectDoYouWantToReceiveTextMessageReminders(textRemindersContent.fields.doYouWantTextMsgReminders.no);
    IenterDetailsFromNoRepresentativeToEnd(I);

    IconfirmDetailsArePresent(I);
    I.see('07411738663', selectors.appellant.phoneNumber);
    I.see('No', selectors.textMsgReminders.receiveTxtMsgReminders);

});

const IenterDetailsFromStartToNINO = (I) => {

    I.enterBenefitTypeAndContinue('PIP');
    I.enterPostcodeAndContinue('WV11 2HE');
    I.continueFromIndependance();
    I.selectHaveYouGotAMRNAndContinue(haveAMRNContent.fields.haveAMRN.yes);
    I.enterDWPIssuingOfficeAndContinue('1');
    I.enterAnMRNDateAndContinue(oneMonthAgo);
    I.selectAreYouAnAppointeeAndContinue(appointeeContent.fields.isAppointee.no);
    I.enterAppellantNameAndContinue('Mr','Harry','Potter');
    I.enterAppellantDOBAndContinue('25','01','1980');
    I.enterAppellantNINOAndContinue('NX877564C');

};

const IenterDetailsFromNoRepresentativeToEnd = (I) => {

    I.selectDoYouHaveARepresentativeAndContinue('No');
    I.enterReasonForAppealingAndContinue('A reason...');
    I.enterAnythingElseAndContinue('Anything else...');
    I.readSendingEvidenceAndContinue();
    I.enterDoYouWantToAttendTheHearing('No');
    I.readYouHaveChosenNotToAttendTheHearingNoticeAndContinue();
};

const IconfirmDetailsArePresent = (I) => {

    // We are on CYA
    I.seeCurrentUrlEquals('/check-your-appeal');

    // Type of benefit
    I.see('Personal Independence Payment (PIP)');

    // MRN address number
    I.see('1', selectors.mrn.dwpIssuingOffice);

    // Date of MRN
    I.see(oneMonthAgo.format('DD MMMM YYYY'));

    // Appellant name
    I.see('Mr Harry Potter');

    // Appellant DOB
    I.see('25 January 1980');

    // Appellant NINO
    I.see('NX877564C');

    // Appellant address
    I.see('4 Privet Drive');
    I.see('Off Wizards close');
    I.see('Little Whinging');
    I.see('Kent');
    I.see('PA80 5UU');

    // Appellant Reason for appealing
    I.see('A reason...');

    // Anything else the appellant wants to tell the tribunal
    I.see('Anything else...');

    // Shows when the appeal is complete
    I.see('Sign and submit');

};