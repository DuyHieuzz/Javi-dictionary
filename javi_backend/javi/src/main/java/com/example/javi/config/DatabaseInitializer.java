package com.example.javi.config;

import java.util.ArrayList;
import java.util.List;

import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

import com.example.javi.entity.*;
import com.example.javi.repository.PermissionRepository;
import com.example.javi.repository.RoleRepository;
import com.example.javi.repository.UsersRepository;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;

@Configuration
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class DatabaseInitializer implements ApplicationRunner {
    PasswordEncoder passwordEncoder;
    UsersRepository usersRepository;
    RoleRepository roleRepository;
    PermissionRepository permissionRepository;

    static final String ADMIN_USER_NAME = "admin";
    static final String ADMIN_PASSWORD = "123456";
    static final String ADMIN_EMAIL = "admin@gmail.com";
    static final String USER_USER_NAME = "user";
    static final String USER_PASSWORD = "123456";
    static final String USER_EMAIL = "user@gmail.com";

    @Override
    public void run(ApplicationArguments args) throws Exception {
        if (permissionRepository.count() == 0) {
            ArrayList<Permission> arr = new ArrayList<>();
            arr.add(new Permission("CREATE_GRAMMAR", "Cho phép tạo mẫu ngữ pháp mới.", true));
            arr.add(new Permission("UPDATE_GRAMMAR", "Cho phép cập nhật mẫu ngữ pháp", true));
            arr.add(new Permission("DELETE_GRAMMAR", "Cho phép xóa mẫu ngữ pháp", true));
            arr.add(new Permission("CREATE_VOCABULARY", "Cho phép tạo từ vựng mới", true));
            arr.add(new Permission("UPDATE_VOCABULARY", "Cho phép cập nhật từ vựng", true));
            arr.add(new Permission("DELETE_VOCABULARY", "Cho phép xóa từ vựng", true));
            arr.add(new Permission("CREATE_KANJI", "Cho phép tạo kanji mới", true));
            arr.add(new Permission("UPDATE_KANJI", "Cho phép cập nhật mẫu kanji", true));
            arr.add(new Permission("DELETE_KANJI", "Cho phép xóa kanji", true));
            arr.add(new Permission("USE_EXPLAIN_VOCABULARY", "Cho phép sử dụng Ai giải thích từ vựng", true));
            arr.add(new Permission("CREATE_COMMENT", "Cho phép bình luận", true));
            arr.add(new Permission("DELETE_COMMENT", "Cho phép xóa bình luận", true));
            arr.add(new Permission("MANAGE_USER_COMMENT", "Cho phép xóa bình luận của người dùng", true));
            arr.add(new Permission("BLOCK_USER", "Cho phép chặn người dùng", true));
            arr.add(new Permission("MANAGE_USER", "Cho phép quản lý tạo, cập nhật người dùng", true));
            permissionRepository.saveAll(arr);
        }

        if (roleRepository.findByName("ADMIN").isEmpty()) {
            List<Permission> allPermissions = permissionRepository.findAll();
            Role adminRole = new Role();
            adminRole.setName("ADMIN");
            adminRole.setDescription("Admin có toàn quyền hệ thống");
            adminRole.setSystemRole(true);
            adminRole.setPermissions(allPermissions);
            roleRepository.save(adminRole);
        }

        if (roleRepository.findByName("USER").isEmpty()) {
            List<Permission> userPermissions = permissionRepository.findAll().stream()
                    .filter(p ->
                            p.getName().equals("CREATE_COMMENT") || p.getName().equals("DELETE_COMMENT"))
                    .toList();

            Role userRole = new Role();
            userRole.setName("USER");
            userRole.setDescription("Người dùng cơ bản");
            userRole.setSystemRole(true);
            userRole.setPermissions(userPermissions);
            roleRepository.save(userRole);
        }

        if (usersRepository.findByUsername(ADMIN_USER_NAME).isEmpty()) {
            Role adminRole = roleRepository.findByName("ADMIN").get();
            Users adminUser = new Users();
            adminUser.setUsername(ADMIN_USER_NAME);
            adminUser.setPassword(passwordEncoder.encode(ADMIN_PASSWORD));
            adminUser.setEmail(ADMIN_EMAIL);
            adminUser.setStatus(Status.ACTIVE);
            adminUser.setRole(adminRole);
            adminUser.setAccountType(AccountType.PREMIUM);
            adminUser.setRemainingTrialExplains(5);
            adminUser.setVerified(true);
            usersRepository.save(adminUser);
        }

        if (usersRepository.findByUsername(USER_USER_NAME).isEmpty()) {
            Role userRole =
                    roleRepository.findByName(USER_USER_NAME.toUpperCase()).get();
            Users user = new Users();
            user.setUsername(USER_USER_NAME);
            user.setPassword(passwordEncoder.encode(USER_PASSWORD));
            user.setEmail(USER_EMAIL);
            user.setStatus(Status.ACTIVE);
            user.setRole(userRole);
            user.setAccountType(AccountType.FREE);
            user.setRemainingTrialExplains(5);
            user.setVerified(true);
            usersRepository.save(user);
        }
    }
}
