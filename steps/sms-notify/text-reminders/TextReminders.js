const { Question, goTo, branch } = require('@hmcts/one-per-page');
const { form, text } = require('@hmcts/one-per-page/forms');
const { answer } = require('@hmcts/one-per-page/checkYourAnswers');
const { titleise } = require('utils/stringUtils');
const sections = require('steps/check-your-appeal/sections');
const userAnswer = require('utils/answer');
const regex = require('utils/regex');
const paths = require('paths');
const Joi = require('joi');

class TextReminders extends Question {
  static get path() {
    return paths.smsNotify.appellantTextReminders;
  }

  get form() {
    return form({
      phoneNumber: text.ref(this.journey.steps.AppellantContactDetails, 'phoneNumber'),
      doYouWantTextMsgReminders: text.joi(
        this.content.fields.doYouWantTextMsgReminders.error.required,
        Joi.string().valid([userAnswer.YES, userAnswer.NO]).required()
      )
    });
  }

  answers() {
    return [
      answer(this, {
        question: this.content.cya.doYouWantTextMsgReminders.question,
        section: sections.textMsgReminders,
        answer: titleise(this.fields.doYouWantTextMsgReminders.value)
      })
    ];
  }

  values() {
    return {
      smsNotify: {
        wantsSMSNotifications: this.fields.doYouWantTextMsgReminders.value === userAnswer.YES
      }
    };
  }

  next() {
    const wantsTextMsgReminders = this.fields.doYouWantTextMsgReminders.value === userAnswer.YES;
    let nextStep = null;
    if (regex.mobileNumber.test(this.fields.phoneNumber.value)) {
      nextStep = this.journey.steps.SendToNumber;
    } else {
      nextStep = this.journey.steps.EnterMobile;
    }
    return branch(
      goTo(nextStep).if(wantsTextMsgReminders),
      goTo(this.journey.steps.Representative)
    );
  }
}

module.exports = TextReminders;
