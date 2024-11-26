import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CredentialDTO } from './dto/credential-dto';
import { Public } from '../decorator/public.decorator';

@Controller('auth')
export class AuthController {

    constructor(
        private authService: AuthService
    ){}

    @Public()
    @Post('/login')
    login(@Body() credentialDto: CredentialDTO){
        return this.authService.signIn(credentialDto);
    }
}
