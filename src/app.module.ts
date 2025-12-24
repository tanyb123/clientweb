import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { StudentsModule } from './students/students.module';
import { DatabaseModule } from './database/database.module';

@Module({
  imports: [DatabaseModule, StudentsModule],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}

