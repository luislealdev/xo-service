import { Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { Role } from 'src/role/entities/role.entity';
import { createCipheriv, randomBytes, scrypt } from 'crypto';
import { promisify } from 'util';
import { Role as RoleEnum } from 'src/enum/role.enum';
import { Event } from 'src/event/entities/event.entity';

export interface Metrics  {
  attendees: number,
  events: number,
  pictures: number
}

@Injectable()
export class UsersService {

  constructor(
    @InjectRepository(User) private userRepository: Repository<User>,
    @InjectRepository(Event) private _eventRepository: Repository<Event>
  ){

  }

  async create(createUserDto: CreateUserDto) {
    const role = new Role();
    const user = new User();
    user.name = createUserDto.name;
    user.username = createUserDto.username;
    user.email = createUserDto.email;
    // user.password = createUserDto.password;
    user.imageFormat = createUserDto.imageFormat;
    user.profilePicture = createUserDto.profilePicture;
    role.id = createUserDto.roleId;
    user.role = role;
    user.verificationCode = createUserDto.verificationCode;
    user.isVerified = createUserDto.isVerified;

    
    const { encryptedText, iv } = await this.encrypt(createUserDto.password);
    user.password = `${iv.toString('hex')}:${encryptedText}`;

  
    return this.userRepository.save(user);
  }

  async findAll() {
    const find = await this.userRepository.find();
    
    return find.map( user => {
      if(user){
        user.password = ''
      }
      return user;
    }) 
  }

  findOne(id: number) {
    return this.userRepository.findOne({
      where: { id: id },
      relations: ['role'],
    });
  }

  findOneByEmail(email: string){
    return this.userRepository.findOne({ where: { email }, relations: ['role'] });
  }

  async update(id: number, updateUserDto: UpdateUserDto) {
    const userById = await this.userRepository.findOneBy({id});
    const role = new Role();

    userById.name = updateUserDto.name;
    userById.username = updateUserDto.username;
    userById.email = updateUserDto.email;
    

    const { encryptedText, iv } = await this.encrypt(updateUserDto.password);
    userById.password = `${iv.toString('hex')}:${encryptedText}`;

    userById.imageFormat = updateUserDto.imageFormat;
    userById.profilePicture = updateUserDto.profilePicture;
    role.id = updateUserDto.roleId;
    userById.role = role;

    userById.verificationCode = updateUserDto.verificationCode;
    userById.isVerified = updateUserDto.isVerified;
    return this.userRepository.save(userById);
  }

  remove(id: number) {
    return this.userRepository.delete({id})
  }

  async findByUsername(username: string) {
    const user = await this.userRepository.findOne({
      where: { username: username },
      relations: ['role']
    });

    
    let metrics: Metrics = {
      attendees: null,
      events: null,
      pictures: null
    }

    if(user){
      user.password = '';

      if(user.role.name == RoleEnum.CREATOR || user.role.name == RoleEnum.ADMIN ){
        const creatorId = user.id

        
        const attendees = await this._eventRepository
          .createQueryBuilder('event')
          .leftJoinAndSelect('event.tickets', 'ticket')
          .where('event.creator_id = :creatorId', { creatorId: user.id })
          .andWhere('ticket.status_id = :statusId', { statusId: 2 })
          .getCount();

        const events = await this._eventRepository.count({
          where: { creator: { id: user.id } },
        });

        const { total_photos } = await this._eventRepository
        .createQueryBuilder('event')
        .select('COUNT(photo.id)', 'total_photos') 
        .leftJoin('event.photos', 'photo')
        .where('event.creator_id = :creatorId', { creatorId: user.id })
        .getRawOne(); 
      
        const photos = Number(total_photos);
      

        metrics = {
          attendees: attendees,
          events: events,
          pictures: photos
        }

        return {user, metrics}
      }
    
      return {user, metrics};
    }
  }


  async encrypt(password: string){
    const iv = randomBytes(16);
    const secret = 'c832di0xie9jc90';
    const key = (await promisify(scrypt)(secret, 'salt', 32)) as Buffer;
    const cipher = createCipheriv('aes-256-ctr', key, iv);

    const encryptedText = Buffer.concat([
      cipher.update(password),
      cipher.final(),
    ]);

    return { encryptedText: encryptedText.toString('hex'), iv };
  }



  async updateUserRoleTo3(userId: number): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['role'],
    });
  
    if (!user) {
      throw new Error(`User with ID ${userId} not found`);
    }
  
    const newRole = new Role();
    newRole.id = 3; 
  
    user.role = newRole;
  
    return await this.userRepository.save(user);
  }
  
}
