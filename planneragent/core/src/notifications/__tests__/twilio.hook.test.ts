import { describe,it,expect,vi } from "vitest";
import { sendTwilioNotification } from "../twilio.hook";
import { sendWhatsApp } from "../providers/twilioWhatsApp";
import { sendWhatsAppViaTwilio } from "../channels/whatsapp.twilio";
describe("legacy Twilio boundaries",()=>{
 it("prohibits arbitrary hook dispatch without network access",async()=>{const fetcher=vi.spyOn(globalThis,"fetch");await expect(sendTwilioNotification({TWILIO_ACCOUNT_SID:"AC_TEST",TWILIO_AUTH_TOKEN:"secret",TWILIO_FROM:"+10000000000"},{to:"+391234567890",message:"arbitrary"})).resolves.toEqual({ok:false,reason:"GOVERNED_TWILIO_LEGACY_BYPASS_PROHIBITED"});expect(fetcher).not.toHaveBeenCalled();fetcher.mockRestore();});
 it("prohibits the old direct WhatsApp provider",async()=>{const fetcher=vi.spyOn(globalThis,"fetch");await expect(sendWhatsApp("arbitrary",{accountSid:"AC_TEST",authToken:"secret",fromWhatsApp:"whatsapp:+10000000000",toWhatsApp:"whatsapp:+391234567890"})).rejects.toThrow(/GOVERNED_TWILIO_LEGACY_BYPASS_PROHIBITED/);expect(fetcher).not.toHaveBeenCalled();fetcher.mockRestore();});
 it("keeps the generic WhatsApp wrapper fail-closed",async()=>{const fetcher=vi.spyOn(globalThis,"fetch");await expect(sendWhatsAppViaTwilio({TWILIO_ACCOUNT_SID:"AC_TEST",TWILIO_AUTH_TOKEN:"secret",TWILIO_FROM:"+10000000000"},{to:"+391234567890",message:{subject:"x",body:"arbitrary"}})).resolves.toMatchObject({ok:false,reason:"GOVERNED_TWILIO_LEGACY_BYPASS_PROHIBITED"});expect(fetcher).not.toHaveBeenCalled();fetcher.mockRestore();});
});
