'use strict';

const { expect, sinon } = require('test/util/chai');
const SmsConfirmation = require('steps/sms-notify/sms-confirmation/SmsConfirmation');
const sections = require('steps/check-your-appeal/sections');
const paths = require('paths');
const userAnswer = require('utils/answer');

describe('SmsConfirmation.js', () => {

    let smsConfirmation;

    beforeEach(() => {

        smsConfirmation = new SmsConfirmation({
            journey: {
                steps: {
                    Representative: paths.representative.representative
                }
            }
        });

        smsConfirmation.fields = {
            phoneNumber: {},
            enterMobile: {},
            useSameNumber: {}
        };
    });

    describe('get path()', () => {

        it('returns path /sms-confirmation', () => {
            expect(SmsConfirmation.path).to.equal('/sms-confirmation');
        });

    });

    describe('get mobileNumber()', () => {

        it('should return enterMobile when the appellantPhoneNumber is an empty string', () => {
            smsConfirmation.fields.phoneNumber.value = '';
            smsConfirmation.fields.enterMobile.value = '07411738663';
            expect(smsConfirmation.mobileNumber).to.eq(smsConfirmation.fields.enterMobile.value);
        });

        it('should return enterMobile when the appellantPhoneNumber is not a mobile', () => {
            smsConfirmation.fields.phoneNumber.value = '01277345672';
            smsConfirmation.fields.enterMobile.value = '07411738663';
            expect(smsConfirmation.mobileNumber).to.eq(smsConfirmation.fields.enterMobile.value);
        });

        it('should return enterMobile when the appellantPhoneNumber is a mobile but provides another', () => {
            smsConfirmation.fields.phoneNumber.value = '07411738765';
            smsConfirmation.fields.useSameNumber.value = userAnswer.NO;
            smsConfirmation.fields.enterMobile.value = '07411738371';
            expect(smsConfirmation.mobileNumber).to.eq(smsConfirmation.fields.enterMobile.value);
        });

        it('should return appellantPhoneNumber which is a mobile', () => {
            smsConfirmation.fields.phoneNumber.value = '07411738765';
            smsConfirmation.fields.useSameNumber.value = userAnswer.YES;
            expect(smsConfirmation.mobileNumber).to.eq(smsConfirmation.fields.phoneNumber.value);
        });

    });

    describe('get form()', () => {

        it('should contain 3 fields', () => {
            expect(smsConfirmation.form.fields.length).to.equal(3);
        });

        it('should contain a textField reference called \'enterMobile\'', () => {
            const textField = smsConfirmation.form.fields[0];
            expect(textField.constructor.name).to.eq('Reference');
            expect(textField.name).to.equal('enterMobile');
            expect(textField.validations).to.be.empty;
        });

        it('should contain a textField reference called \'useSameNumber\'', () => {
            const textField = smsConfirmation.form.fields[1];
            expect(textField.constructor.name).to.eq('Reference');
            expect(textField.name).to.equal('useSameNumber');
            expect(textField.validations).to.be.empty;
        });

        it('should contain a textField reference called \'year\'', () => {
            const textField = smsConfirmation.form.fields[2];
            expect(textField.constructor.name).to.eq('Reference');
            expect(textField.name).to.equal('phoneNumber');
            expect(textField.validations).to.be.empty;
        });

    });

    describe('answers() and values()', () => {

        const question = 'A Question';

        beforeEach(() => {

            smsConfirmation.content = {
                cya: {
                    mobileNumber: {
                        question
                    }
                }
            };

            smsConfirmation.fields = {
                useSameNumber: {},
                phoneNumber: {
                    value: '07411333333'
                },
                enterMobile: {
                    value: '07411444444'
                }
            };
        });

        it('should contain a single answer', () => {
            const answers = smsConfirmation.answers();
            expect(answers.length).to.equal(1);
            expect(answers[0].question).to.equal(question);
            expect(answers[0].section).to.equal(sections.textMsgReminders);
            expect(answers[0].url).to.equal(paths.smsNotify.sendToNumber);
        });

        it('should use the same number from the appellant details step', () => {
            smsConfirmation.fields.useSameNumber.value = userAnswer.YES;
            const values = smsConfirmation.values();
            expect(values).to.eql({ smsNotify: { useSameNumber: true, smsNumber: '07411333333' } });
        });

        it('should only use the enter mobile number', () => {
            smsConfirmation.fields.useSameNumber.value = userAnswer.NO;
            const values = smsConfirmation.values();
            expect(values).to.eql({ smsNotify: { useSameNumber: false, smsNumber: '07411444444' } });
        });
    });

    describe('next()', () => {

        it('returns the next step path /representative', () => {
            expect(smsConfirmation.next()).to.eql({ nextStep: paths.representative.representative });
        });

    });

});
