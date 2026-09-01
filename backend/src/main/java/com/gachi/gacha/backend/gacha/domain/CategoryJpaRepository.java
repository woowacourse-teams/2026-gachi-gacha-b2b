package com.gachi.gacha.backend.gacha.domain;

import java.util.Collection;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface CategoryJpaRepository extends JpaRepository<Category, Long> {

    List<Category> findAllByNameIn(Collection<String> names);

    List<Category> findAllByOrderByNameAsc();

    boolean existsByName(String name);
}
