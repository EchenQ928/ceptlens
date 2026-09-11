import { expect, it } from "vitest";
import { safeReturnPath } from "./SignInPage";
it("returns to the requested learning page without accepting external or recursive destinations",()=>{
 expect(safeReturnPath('/learn/questions/Q10?mode=quick')).toBe('/learn/questions/Q10?mode=quick');
 for(const path of ['https://evil.example','//evil.example','/\\evil.example','/sign-in?next=/sign-in',null])expect(safeReturnPath(path)).toBe('/');
});
