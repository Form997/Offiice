import test from "node:test";
import assert from "node:assert/strict";
import {generateRegistrationOptions,verifyRegistrationResponse,generateAuthenticationOptions,verifyAuthenticationResponse} from "@simplewebauthn/server";
test("SimpleWebAuthn server exposes the registration and authentication primitives",()=>{for(const fn of [generateRegistrationOptions,verifyRegistrationResponse,generateAuthenticationOptions,verifyAuthenticationResponse])assert.equal(typeof fn,"function");});
